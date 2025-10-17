import { useState, useMemo } from 'react';
import {
  Collapse, Row, Col, Card, Tag, Typography, Space, Button,
  Skeleton, Empty, message
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useParams, useLocation } from 'react-router-dom';
import { useMenuItems, useUpdateMenuItem } from '../../../hooks/useMenuItems';
import MenuItemEditModal from './MenuItemEditModal';
import { getPrimaryMenuUrl } from '../../../utils/images';

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

// Helper: group items by POS category label
function groupByCategory (items = []) {
  const map = new Map();
  for (const it of items) {
    const label = it.category || 'Uncategorized';
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(it);
  }
  return map;
}

export default function MenuPage () {
  const { rid } = useParams();
  const { state } = useLocation();
  const restaurant = state?.restaurant;

  const { data, isLoading, isError, error, refetch, isFetching } = useMenuItems(rid);
  const { mutateAsync: saveItem, isPending: saving } = useUpdateMenuItem(rid);

  const [editing, setEditing] = useState(null);

  // Sort by displayOrder then by name (like POS)
  const sorted = useMemo(() => {
    const list = data || [];
    return [...list].sort((a, b) => {
      const ao = a.displayOrder ?? 100000;
      const bo = b.displayOrder ?? 100000;
      if (ao !== bo) return ao - bo;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [data]);

  // Build Collapse panels from category groups
  const collapseItems = useMemo(() => {
    const groups = groupByCategory(sorted);
    const panels = [];
    for (const [label, list] of groups.entries()) {
      panels.push({
        key: label,
        label: (
          <div className='menu-cat-header'>
            <span className='menu-cat-title'>{label}</span>
          </div>
        ),
        children: (
          <Space direction='vertical' size={16} style={{ width: '100%' }}>
            {list.map((item) => {
              const thumb = getPrimaryMenuUrl(item.images);
              return (
                <Card key={item._id} bodyStyle={{ padding: 16 }} style={{ borderRadius: 10 }}>
                  <Row gutter={16} align='middle'>
                    <Col xs={24} md={18}>
                      <Space size='small' style={{ marginBottom: 6, flexWrap: 'wrap' }}>
                        {(item.tags || []).map((t, i) => <TagPill key={i} text={t} />)}
                      </Space>

                      <Title level={4} style={{ margin: 0 }}>
                        {item.name || 'Untitled item'}
                      </Title>

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
                    </Col>

                    {/* RIGHT: image + Edit on far right */}
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
                          {thumb
                            ? (
                              <img
                                src={thumb}
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

                        <Button
                          size='large'
                          type='primary'
                          icon={<EditOutlined />}
                          onClick={() => setEditing(item)}
                        >
                          Edit
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </Space>
        )
      });
    }
    // Sort panels alphabetically by key (category label)
    panels.sort((a, b) => String(b.key).localeCompare(String(a.key)));
    return panels;
  }, [sorted]);

  return (
    <div style={{ paddingRight: 8 }}>
      {/* Loading */}
      {isLoading && (
        <div style={{ padding: 12 }}>
          <Skeleton active paragraph={{ rows: 2 }} />
          <Skeleton active paragraph={{ rows: 2 }} />
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <div style={{ padding: 16 }}>
          <Title level={4}>Failed to load menu</Title>
          <Text type='danger'>{error?.message || 'Unknown error'}</Text>
          <div style={{ marginTop: 12 }}>
            <Button onClick={() => refetch()} loading={isFetching}>Retry</Button>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && (
        <>
          {(!data || data.length === 0)
            ? (
              <Empty description='No menu items yet' />
              )
            : (
              <Collapse
                accordion={false}
                bordered={false}
                items={collapseItems}
                expandIconPosition='start'
                defaultActiveKey={collapseItems.slice(0, 1).map(i => i.key)}
                style={{ background: 'transparent' }}
              />
              )}

          <MenuItemEditModal
            open={!!editing}
            item={{ ...editing, restaurantId: rid }}
            saving={saving}
            onCancel={() => setEditing(null)}
            onSave={async (data) => {
              try {
                await saveItem({ itemId: editing._id, data });
                message.success('Menu item updated');
                setEditing(null);
                refetch(); // refresh list so primary image updates
              } catch (e) {
                message.error(e?.response?.data?.message || e.message || 'Failed to update');
              }
            }}
            supportsMultipart={false}
          />
        </>
      )}
    </div>
  );
}
