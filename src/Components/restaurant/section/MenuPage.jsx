// src/Components/restaurant/section/MenuPage.jsx
import { useState } from 'react';
import { Row, Col, Card, Tag, Typography, Space, Button, Skeleton, Empty, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useParams, useLocation } from 'react-router-dom';
import { useMenuItems, useUpdateMenuItem } from '../../../hooks/useMenuItems';
import MenuItemEditModal from './MenuItemEditModal';

const { Title, Text, Paragraph } = Typography;

function TagPill ({ text }) {
  const raw = String(text || '');
  const t = raw.toLowerCase().trim();
  const isNonVeg =
    /(^|\W)non[\s-]*veg/i.test(raw) || t.includes('non-vegetarian') || t.includes('non vegetarian');
  const isVeg = !isNonVeg && (t.includes('veg') || t.includes('vegetarian'));
  const isBestseller = t.includes('bestseller');
  const color = isNonVeg ? 'red' : isVeg ? 'green' : isBestseller ? 'gold' : 'blue';
  return <Tag color={color} style={{ borderRadius: 12, padding: '0 8px' }}>{raw}</Tag>;
}

export default function MenuPage () {
  const { rid } = useParams();
  const { state } = useLocation();
  const restaurant = state?.restaurant;

  const { data, isLoading, isError, error, refetch, isFetching } = useMenuItems(rid);
  const { mutateAsync: saveItem, isPending: saving } = useUpdateMenuItem(rid);

  const [editing, setEditing] = useState(null);

  if (isLoading) {
    return (
      <div style={{ padding: 12 }}>
        <Skeleton active paragraph={{ rows: 2 }} />
        <Skeleton active paragraph={{ rows: 2 }} />
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: 16 }}>
        <Title level={4}>Failed to load menu</Title>
        <Text type='danger'>{error?.message || 'Unknown error'}</Text>
        <div style={{ marginTop: 12 }}>
          <Button onClick={() => refetch()} loading={isFetching}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div style={{ padding: 16 }}>
        <Empty description='No menu items yet' />
      </div>
    );
  }

  return (
    <div style={{ paddingRight: 8 }}>
      <Space direction='vertical' size={16} style={{ width: '100%' }}>
        {data.map(item => (
          <Card key={item._id} bodyStyle={{ padding: 16 }} style={{ borderRadius: 10 }}>
            <Row gutter={16} align='middle'>
              {/* LEFT: text */}
              <Col xs={24} md={18}>
                <Space size='small' style={{ marginBottom: 6, flexWrap: 'wrap' }}>
                  {(item.tags || []).map((t, i) => <TagPill key={i} text={t} />)}
                </Space>

                <Title level={4} style={{ margin: 0 }}>{item.name || 'Untitled item'}</Title>

                {item.description
                  ? (
                    <Paragraph
                      type='secondary'
                      style={{ marginTop: 6 }}
                      ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
                    >
                      {item.description}
                    </Paragraph>
                    )
                  : (
                    <Text type='secondary'>No description provided.</Text>
                    )}

                {typeof item.price === 'number' && (
                  <Title level={5} style={{ marginTop: 8 }}>
                    ₹ {item.price.toFixed(2)}
                  </Title>
                )}
              </Col>

              {/* RIGHT: compact image + Edit pushed to far right */}
              <Col xs={24} md={6} style={{ display: 'flex' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                  <div
                    style={{
                      width: 140,
                      height: 100,
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#f5f5f5',
                      position: 'relative',
                      marginRight: 4
                    }}
                  >
                    {item.images?.[0]
                      ? (
                        <img
                          src={item.images[0]}
                          alt={item.name || 'menu image'}
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

                  {/* Push button to the far right */}
                  <Button
                    size='large'
                    type='primary'
                    icon={<EditOutlined />}
                    onClick={() => setEditing(item)}
                    style={{ marginLeft: '20%' }}
                  >
                    Edit
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>
        ))}
      </Space>

      <MenuItemEditModal
        open={!!editing}
        item={editing}
        saving={saving}
        onCancel={() => setEditing(null)}
        onSave={async (data) => { // data will be { description: '...' }
          try {
            await saveItem({ itemId: editing._id, data });
            message.success('Menu item updated');
            setEditing(null);
          } catch (e) {
            message.error(e?.response?.data?.message || e.message || 'Failed to update');
          }
        }}
        supportsMultipart={false}
      />
    </div>
  );
}
