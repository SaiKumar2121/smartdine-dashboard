import { memo } from 'react';
import { Row, Col, Card, Typography, Space, Button, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

function TagPill ({ text }) {
  const raw = String(text || '');
  const t = raw.toLowerCase();
  const isNonVeg = /(^|\W)non[\s-]*veg/i.test(raw) || t.includes('non-vegetarian') || t.includes('non vegetarian');
  const isVeg = !isNonVeg && (t.includes('veg') || t.includes('vegetarian'));
  const isBest = t.includes('bestseller');
  const color = isNonVeg ? 'red' : isVeg ? 'green' : isBest ? 'gold' : 'blue';
  return <Tag color={color} style={{ borderRadius: 12, padding: '0 8px' }}>{raw}</Tag>;
}

function MenuCategorySection ({ items, onEdit }) {
  return (
    <Space direction='vertical' size={16} style={{ width: '100%' }}>
      {items.map(item => (
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
                  <Paragraph type='secondary' style={{ marginTop: 6 }} ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}>
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
                      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#999' }}>
                        No image
                      </div>
                      )}
                </div>

                <Button
                  size='large'
                  type='primary'
                  icon={<EditOutlined />}
                  onClick={() => onEdit(item)}
                  style={{ marginLeft: 'auto' }}
                >
                  Edit
                </Button>
              </div>
            </Col>
          </Row>
        </Card>
      ))}
    </Space>
  );
}

export default memo(MenuCategorySection);
