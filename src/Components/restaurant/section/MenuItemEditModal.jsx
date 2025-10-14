import { useState, useMemo } from 'react';
import { Modal, Form, Input, Upload, Image, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function MenuItemEditModal ({
  open,
  item,
  onCancel,
  onSave,
  saving,
  supportsMultipart = true
}) {
  const [form] = Form.useForm();

  const initialFiles = useMemo(() => {
    const imgs = item?.images ?? [];
    return imgs.map((url, idx) => ({
      uid: String(idx + 1),
      name: url.split('/').pop() || `image-${idx + 1}.jpg`,
      status: 'done',
      url
    }));
  }, [item]);

  const [fileList, setFileList] = useState(initialFiles);

  // When modal opens with a new item, reset form & files
  const resetFromItem = () => {
    form.setFieldsValue({ description: item?.description ?? '' });
    setFileList(initialFiles);
  };

  return (
    <Modal
      title={item?.name ? `Edit · ${item.name}` : 'Edit menu item'}
      open={open}
      onCancel={onCancel}
      okText='Save changes'
      confirmLoading={saving}
      afterOpenChange={(visible) => { if (visible) resetFromItem(); }}
      onOk={() => {
        form.validateFields().then(values => {
          // Build payload
          if (supportsMultipart) {
            const fd = new FormData();
            fd.append('description', values.description ?? '');

            // Keep existing remote URLs that user didn't remove
            const keptUrls = fileList
              .filter(f => f.status === 'done' && f.url && !f.originFileObj)
              .map(f => f.url);
            keptUrls.forEach((u, i) => fd.append('keepImages[]', u));

            // New files
            fileList
              .filter(f => f.originFileObj)
              .forEach(f => fd.append('images', f.originFileObj));

            onSave(fd);
          } else {
            // JSON mode (send URLs only)
            const urls = fileList
              .filter(f => f.status === 'done' && (f.url || f.response?.url))
              .map(f => f.url || f.response?.url);
            onSave({ description: values.description ?? '', images: urls });
          }
        }).catch(() => {});
      }}
      width={720}
    >
      <Form form={form} layout='vertical' initialValues={{ description: item?.description ?? '' }}>
        <Form.Item label='Description' name='description'>
          <Input.TextArea autoSize={{ minRows: 3 }} placeholder='Write a clear description for this dish…' />
        </Form.Item>

        <Form.Item label='Images'>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Upload
              listType='picture-card'
              fileList={fileList}
              beforeUpload={() => false} // prevent auto upload – we send all in one PATCH
              multiple
              onChange={({ fileList: fl }) => setFileList(fl)}
              onRemove={(file) => {
                // If removing an existing URL, just let it drop from the list
                setFileList(prev => prev.filter(f => f.uid !== file.uid));
                return true;
              }}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>

            {/* Large preview row (optional) */}
            {fileList.length === 0 && (
              <Image
                width={160}
                src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='120'><rect width='160' height='120' fill='%23f5f5f5'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-family='Arial' font-size='12'>No image</text></svg>"
                preview={false}
              />
            )}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
