import React, { memo, useState } from 'react';
import { Card, Typography, Space, Row, Col, Skeleton, Empty, Button, message, Tag, Divider, Badge, Tooltip } from 'antd';
import { EditOutlined, ClusterOutlined, LinkOutlined, FireOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useCategoryGroups, useCreateCategoryGroup, useUpdateCategoryGroup } from '../../../hooks/useCategoryGroups';
import CategoryGroupEditModal from './CategoryGroupEditModal';

const { Title, Text } = Typography;

function CategoryGroups() {
  const { rid } = useParams();
  const { data: groups, isLoading, isError, error, refetch } = useCategoryGroups(rid);
  const { mutateAsync: createGroup, isPending: creating } = useCreateCategoryGroup();
  const { mutateAsync: updateGroup, isPending: updating } = useUpdateCategoryGroup();

  const [editingGroup, setEditingGroup] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const triggerOrder = ['ON_CATEGORY_GROUP_START', 'WHILE_CATEGORY_GROUP_ACTIVE', 'ON_CATEGORY_GROUP_END'];
  const normalizeTrigger = (value = '') => value.toUpperCase();
  const sortLinkedGroups = (links = []) => {
    return [...links].sort((a, b) => {
      const aIndex = triggerOrder.indexOf(normalizeTrigger(a.triggerEvent));
      const bIndex = triggerOrder.indexOf(normalizeTrigger(b.triggerEvent));
      const aScore = aIndex === -1 ? triggerOrder.length : aIndex;
      const bScore = bIndex === -1 ? triggerOrder.length : bIndex;
      if (aScore !== bScore) return aScore - bScore;
      return (getGroupName(a.targetCategoryGroupId) || '').localeCompare(getGroupName(b.targetCategoryGroupId) || '');
    });
  };

  const handleSave = async (values) => {
    try {
      if (isCreating || !editingGroup?._id && !editingGroup?.id) {
        await createGroup({
          restaurantId: rid,
          data: values
        });
        message.success('Category group created successfully');
      } else {
        await updateGroup({
          restaurantId: rid,
          categoryGroupId: editingGroup._id || editingGroup.id,
          data: values
        });
        message.success('Category group updated successfully');
      }
      setEditingGroup(null);
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || 'Failed to save category group');
    }
  };

  const getGroupName = (id) => {
    const g = groups?.find(item => (item._id === id || item.id === id));
    return g ? g.name : 'Unknown Group';
  };

  const containerStyle = {
    // background: 'linear-gradient(135deg, #10396b 0%, #1c578a 45%, #0f9b8e 100%)',
    background: '#F5F7FA',
    padding: 20,
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 14px 40px rgba(0,0,0,0.28)',
    color: '#f5f7fb'
  };

  const cardStyle = {
    border: 'none',
    background: 'rgba(255,255,255,0.94)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
    borderRadius: 14
  };

  if (isLoading) {
    return (
      <div style={{ padding: 12 }}>
        <Skeleton active paragraph={{ rows: 2 }} />
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: 16 }}>
        <Title level={4}>Failed to load category groups</Title>
        <Text type='danger'>{error?.message || 'Unknown error'}</Text>
        <div style={{ marginTop: 12 }}>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return <Empty description='No category groups available' />;
  }

  return (
    <>
      <div style={containerStyle}>
        <Row justify='space-between' align='middle' gutter={12} style={{ marginBottom: 12 }}>
          <Col>
            <Space>
              <Badge color='#40a9ff' />
              <div>
                <Text style={{ color: '#000205ff', letterSpacing: 0.3 }}>Category Automations</Text>

              </div>
            </Space>
          </Col>
          <Col>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              loading={creating}
              onClick={() => {
                setIsCreating(true);
                setEditingGroup({});
              }}
            >
              Add Category Group
            </Button>
          </Col>
        </Row>

        <Space direction='vertical' size={12} style={{ width: '100%' }}>
          {groups.map((group) => {
            const groupId = group._id || group.id;
            const eligible = group.isCurrentCategoryGroupEligible;
            const maxItems = group.maxItemsPerGuest ?? 'Unlimited';
            const sortedLinkedGroups = sortLinkedGroups(group.linkedCategoryGroups);

            return (
              <Card
                key={groupId}
                style={cardStyle}
                bodyStyle={{ padding: 16 }}
                title={
                  <Space size={8} wrap align="center">
                    <ClusterOutlined style={{ color: '#1677ff' }} />
                    <Text strong style={{ fontSize: 16 }}>{group.name}</Text>
                    <Divider type="vertical" style={{ margin: '0 8px', height: '1.2em', top: 0 }} />
                    <Tag color={eligible ? 'success' : 'volcano'} style={{ margin: 0 }}>
                      {eligible ? 'Eligible as Current Group' : 'Not Eligible as Current Group'}
                    </Tag>
                    <Tag color='blue' style={{ margin: 0 }}>
                      Max items per guest: {maxItems}
                    </Tag>
                  </Space>
                }
                extra={
                  <Button
                    type='primary'
                    ghost
                    icon={<EditOutlined />}
                    onClick={() => setEditingGroup(group)}
                  >
                    Edit
                  </Button>
                }
              >
                <Row gutter={[12, 12]} align='middle'>
                  <Col span={24}>
                    <Space wrap>
                      <Tooltip title='Automated triggers to other groups'>
                        <Tag icon={<LinkOutlined />} color={sortedLinkedGroups?.length ? 'geekblue' : 'default'} style={{ margin: 0 }}>
                          {sortedLinkedGroups?.length ? `${sortedLinkedGroups.length} linked` : 'No linked groups'}
                        </Tag>
                      </Tooltip>
                      {sortedLinkedGroups?.length
                        ? (
                          sortedLinkedGroups.map((link, idx) => (
                            <Tag
                              key={`${groupId}-${idx}`}
                              color='processing'
                              style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <FireOutlined style={{ color: '#fa8c16' }} />
                              <span style={{ fontWeight: 600 }}>{link.triggerEvent.replace(/_/g, ' ')}</span>
                              <span style={{ opacity: 0.8 }}>→ {getGroupName(link.targetCategoryGroupId)}</span>
                            </Tag>
                          ))
                        )
                        : null}
                    </Space>
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <Space size={10}>
                  <Text type='secondary'>ID</Text>
                  <Tag color='default' style={{ margin: 0 }}>{groupId}</Tag>
                </Space>
              </Card>
            );
          })}
        </Space>
      </div>

      <CategoryGroupEditModal
        open={!!editingGroup}
        group={editingGroup}
        allGroups={groups}
        saving={updating || creating}
        onCancel={() => {
          setEditingGroup(null);
          setIsCreating(false);
        }}
        onSave={handleSave}
      />
    </>
  );
}

export default memo(CategoryGroups);
