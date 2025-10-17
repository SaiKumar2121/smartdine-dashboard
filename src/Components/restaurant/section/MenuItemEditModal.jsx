import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Space,
  Button,
  Typography,
  Popconfirm,
  Tooltip
} from 'antd';
import { CloseCircleFilled, LeftOutlined, RightOutlined } from '@ant-design/icons';
import ManageImagesModal from './ManageImagesModal';
import { coerceImages, getPrimaryMenuUrl } from '../../../utils/images';

const { Text } = Typography;

// Small helper to dedupe items by a computed key
const uniqueBy = (arr, getKey) => {
  const seen = new Set();
  return arr.filter((x) => {
    const k = getKey(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

export default function MenuItemEditModal ({
  open,
  item,
  onCancel,
  onSave,
  saving
}) {
  const [form] = Form.useForm();

  // Normalize whatever comes from API (now only menu/promo objects)
  const [imagesDraft, setImagesDraft] = useState(coerceImages(item?.images ?? []));
  const [manageOpen, setManageOpen] = useState(false);

  // Visible thumbnails: menu + promo (deduped)
  const visibleImages = uniqueBy(
    coerceImages(imagesDraft).filter(im => im.type === 'menu' || im.type === 'promo'),
    im => `${im.type}:${im.id || im.url}`
  );

  // Scroll ref for the thumbnail strip
  const stripRef = useRef(null);
  const scrollStrip = (dir) => {
    if (!stripRef.current) return;
    stripRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  // Reset when the modal opens / item changes
  const resetFromItem = () => {
    form.setFieldsValue({ description: item?.description ?? '' });
    setImagesDraft(coerceImages(item?.images ?? []));
  };

  useEffect(() => {
    if (open) resetFromItem();
  }, [open, item?._id]);

  // Primary display (prefer menu -> promo)
  const primaryUrl = getPrimaryMenuUrl(imagesDraft);

  // Delete one variant from the draft (DB-only until Save)
  const removeFromDraft = (target) => {
    const key = target.id || target.url;
    setImagesDraft(prev =>
      coerceImages(prev).filter(x => (x.id || x.url) !== key)
    );
  };

  return (
    <Modal
      title={item?.name ? `Edit · ${item.name}` : 'Edit menu item'}
      open={open}
      onCancel={onCancel}
      okText='Save changes'
      confirmLoading={saving}
      onOk={() => {
        form.validateFields()
          .then((values) => {
            const normalized = coerceImages(imagesDraft).map(({ id, type, url }) => ({
              id, type, url
            }));
            onSave({
              description: values.description ?? '',
              images: normalized
            });
          })
          .catch(() => {});
      }}
      width={760}
    >
      <Form form={form} layout='vertical' initialValues={{ description: item?.description ?? '' }}>
        <Form.Item label='Description' name='description'>
          <Input.TextArea
            autoSize={{ minRows: 3 }}
            placeholder='Write a clear description for this dish…'
          />
        </Form.Item>

        <Form.Item label='Images'>
          <Space direction='vertical' style={{ width: '100%' }} size={12}>
            {/* Primary display (first menu -> promo) */}
            <div>
              <Text strong>Display image (first “menu”)</Text>
              <div
                style={{
                  width: 160,
                  height: 120,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#f5f5f5',
                  marginTop: 6
                }}
              >
                {primaryUrl
                  ? (
                    <img
                      src={primaryUrl}
                      alt='primary menu'
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    )
                  : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#999'
                      }}
                    >
                      No image
                    </div>
                    )}
              </div>
            </div>

            {/* Open crop/variant modal */}
            <Button onClick={() => setManageOpen(true)}>Manage Images</Button>

            {/* Current images (menu + promo) */}
            <div style={{ marginTop: 8 }}>
              <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center' }}>
                <Text strong style={{ flex: 1 }}>Current images</Text>
                <Space>
                  <Button
                    icon={<LeftOutlined />}
                    onClick={() => scrollStrip(-1)}
                    size='small'
                    disabled={visibleImages.length <= 5}
                  />
                  <Button
                    icon={<RightOutlined />}
                    onClick={() => scrollStrip(1)}
                    size='small'
                    disabled={visibleImages.length <= 5}
                  />
                </Space>
              </div>

              <div
                ref={stripRef}
                style={{
                  width: '100%',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  whiteSpace: 'nowrap',
                  paddingBottom: 6
                }}
              >
                {visibleImages.length === 0
                  ? (

                    <div style={{ color: '#999', padding: '8px 0' }}>
                      No menu/promo images yet. Click <b>Manage Images</b> to add.
                    </div>
                    )
                  : (
                      visibleImages.map((im) => {
                        const key = im.id || im.url;
                        const isMenu = im.type === 'menu';
                        return (
                          <div
                            key={key}
                            style={{
                              display: 'inline-block',
                              width: 120,
                              height: 90,
                              marginRight: 10,
                              position: 'relative',
                              borderRadius: 8,
                              overflow: 'hidden',
                              background: '#f5f5f5',
                              verticalAlign: 'top'
                            }}
                          >
                            <img
                              src={im.url}
                              alt={im.type}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />

                            {/* type pill */}
                            <div
                              style={{
                                position: 'absolute',
                                left: 6,
                                top: 6,
                                background: isMenu ? 'rgba(24,144,255,.9)' : 'rgba(114,46,209,.9)',
                                color: '#fff',
                                fontSize: 11,
                                lineHeight: '16px',
                                padding: '0 6px',
                                borderRadius: 12,
                                textTransform: 'capitalize'
                              }}
                            >
                              {im.type}
                            </div>

                            {/* delete X (DB-only until Save) */}
                            <Popconfirm
                              title='Remove this image from the item?'
                              description='This will remove this variant from MongoDB (S3 file stays).'
                              onConfirm={() => removeFromDraft(im)}
                            >
                              <Tooltip title='Remove from this item'>
                                <CloseCircleFilled
                                  style={{
                                    position: 'absolute',
                                    right: 6,
                                    top: 6,
                                    fontSize: 18,
                                    color: 'red',
                                    cursor: 'pointer',
                                    textShadow: '0 0 2px rgba(255,255,255,.9)'
                                  }}
                                />
                              </Tooltip>
                            </Popconfirm>
                          </div>
                        );
                      })
                    )}
              </div>
            </div>
          </Space>
        </Form.Item>
      </Form>

      {/* Cropping/variant modal */}
      <ManageImagesModal
        open={manageOpen}
        restaurantId={item?.restaurantId}
        menuItemId={item?._id}
        onClose={() => setManageOpen(false)}
        onFinished={(updatedItem) => {
          if (updatedItem?.images) setImagesDraft(coerceImages(updatedItem.images));
          setManageOpen(false);
        }}
      />
    </Modal>
  );
}
