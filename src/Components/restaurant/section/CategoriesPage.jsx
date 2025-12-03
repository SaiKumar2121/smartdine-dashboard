import { Card, Typography, Tag, Space, Skeleton, Empty, Alert, Button, Modal, Form, Input, InputNumber, Select, message, Row, Col, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../../hooks/useCategories';
import { useMenuItems, useUpdateMenuItem } from '../../../hooks/useMenuItems';

const { Text } = Typography;
const { Option } = Select;

const normalizeId = (value) => (value === undefined || value === null ? '' : String(value));

const itemBelongsToCategory = (item, category) => {
  if (!item || !category) return false;
  const targetId = normalizeId(category._id || category.id);
  if (targetId && normalizeId(item.categoryId) === targetId) return true;
  return (item.category || '') === (category.name || '');
};

export default function CategoriesPage () {
  const { rid } = useParams();
  const { data: categories, isLoading, isError, error, refetch, isFetching } = useCategories(rid);
  const { mutateAsync: createCategory, isPending: creating } = useCreateCategory();
  const { mutateAsync: updateCategory, isPending: updating } = useUpdateCategory();
  const { mutateAsync: deleteCategory, isPending: deleting } = useDeleteCategory();
  const { data: menuData } = useMenuItems(rid);
  const { mutateAsync: updateMenuItem, isPending: updatingItems } = useUpdateMenuItem(rid);

  const [open, setOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [moveTargetId, setMoveTargetId] = useState(null);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [isOverDrop, setIsOverDrop] = useState(false);
  const [form] = Form.useForm();

  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
  }, [categories]);

  const selectedCategory = useMemo(
    () => sortedCategories.find(cat => normalizeId(cat._id || cat.id) === normalizeId(selectedCategoryId)) || sortedCategories[0] || null,
    [sortedCategories, selectedCategoryId]
  );

  useEffect(() => {
    if (selectedCategory) {
      setSelectedCategoryId(selectedCategory._id || selectedCategory.id);
    }
  }, [selectedCategory]);

  const menuItems = menuData?.items || [];
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return [];
    return menuItems.filter(item => itemBelongsToCategory(item, selectedCategory));
  }, [menuItems, selectedCategory]);

  const targetCategory = useMemo(
    () => sortedCategories.find(cat => normalizeId(cat._id || cat.id) === normalizeId(moveTargetId)),
    [sortedCategories, moveTargetId]
  );

  const targetItems = useMemo(() => {
    if (!targetCategory) return [];
    return menuItems.filter(item => itemBelongsToCategory(item, targetCategory));
  }, [menuItems, targetCategory]);

  useEffect(() => {
    if (!selectedCategory) return;
    setMoveTargetId(null);
    setDraggingItemId(null);
    setIsOverDrop(false);
    form.setFieldsValue({
      name: selectedCategory.name,
      displayOrder: selectedCategory.displayOrder ?? null,
      type: selectedCategory.type || 'child'
    });
  }, [selectedCategory, form]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        displayOrder: values.displayOrder ?? null,
        type: values.type || 'child'
      };
      await createCategory({ restaurantId: rid, data: payload });
      message.success('Category created');
      setOpen(false);
      form.resetFields();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error(err?.response?.data?.message || 'Failed to create category');
    }
  };

  const handleSave = async () => {
    if (!selectedCategory) return;
    try {
      const values = await form.validateFields();
      const newName = values.name;

      await updateCategory({
        restaurantId: rid,
        categoryId: selectedCategory._id || selectedCategory.id,
        data: {
          name: newName,
          displayOrder: values.displayOrder ?? null,
          type: values.type || 'child'
        }
      });

      message.success('Category updated');
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error(err?.response?.data?.message || 'Failed to update category');
    }
  };

  const handleMoveDrop = async () => {
    if (!selectedCategory || !draggingItemId) return;
    if (!targetCategory?.name) {
      message.warning('Select a target category first.');
      return;
    }
    try {
      await updateMenuItem({ itemId: draggingItemId, data: { categoryId: targetCategory._id || targetCategory.id } });
      message.success('Item moved to selected category');
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || 'Failed to move item');
    } finally {
      setDraggingItemId(null);
      setIsOverDrop(false);
    }
  };

  const handleDeleteCategory = () => {
    if (!selectedCategory) return;
    const itemCount = filteredItems.length;

    Modal.confirm({
      title: 'Delete this category?',
      icon: null,
      content: (
        <Space direction='vertical' size='small'>
          <Text>
            {`This will permanently delete "${selectedCategory.name || 'Untitled Category'}".`}
          </Text>
          {itemCount > 0 && (
            <Text type='danger'>
              {`There are ${itemCount} item(s) in this category. Move items to another category before deleting to avoid losing associations.`}
            </Text>
          )}
        </Space>
      ),
      okText: 'Yes, delete',
      cancelText: 'No',
      okButtonProps: { danger: true },
      async onOk () {
        try {
          await deleteCategory({
            restaurantId: rid,
            categoryId: selectedCategory._id || selectedCategory.id
          });
          message.success('Category deleted');
          setSelectedCategoryId(null);
          setMoveTargetId(null);
        } catch (err) {
          console.error(err);
          message.error(err?.response?.data?.message || 'Failed to delete category');
          throw err;
        }
      }
    });
  };

  if (isLoading || isFetching) {
    return (
      <div style={{ padding: 12 }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <Alert
          type='error'
          message='Failed to load categories'
          description={error?.message || 'Unknown error'}
          action={<a onClick={() => refetch()}>Retry</a>}
        />
      </Card>
    );
  }

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={8} style={{ position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
          <Card
            title={(
              <Space>
                <Button type='primary' icon={<PlusOutlined />} onClick={() => setOpen(true)} loading={creating}>
                  Create Category
                </Button>
              </Space>
            )}
            bodyStyle={{ padding: 16, maxHeight: 'calc(100vh - 140px)', overflow: 'auto' }}
          >
            {(!sortedCategories || sortedCategories.length === 0)
              ? <Empty description='No categories found' />
              : (
                <Space direction='vertical' size='small' style={{ width: '100%' }}>
                  {sortedCategories.map((cat, idx) => {
                    const active = normalizeId(cat._id || cat.id) === normalizeId(selectedCategory?._id || selectedCategory?.id);
                    return (
                      <Tag
                        key={cat._id || cat.id || idx}
                        color={active ? 'blue' : 'default'}
                        style={{
                          fontSize: 14,
                          padding: '8px 14px',
                          borderRadius: 20,
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left'
                        }}
                        onClick={() => setSelectedCategoryId(cat._id || cat.id)}
                      >
                        {cat.name || 'Untitled Category'}
                      </Tag>
                    );
                  })}
                </Space>
                )}
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            title={(
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Edit Category</span>
                {selectedCategory && (
                  <Button
                    danger
                    type='text'
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteCategory}
                    loading={deleting}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
            bodyStyle={{ padding: 16 }}
          >
            {selectedCategory
              ? (
                <Form
                  form={form}
                  layout='vertical'
                  initialValues={{
                    type: 'child',
                    displayOrder: null
                  }}
                >
                  <Form.Item
                    name='name'
                    label='Name'
                    rules={[{ required: true, message: 'Please enter a category name' }]}
                  >
                    <Input placeholder='e.g. Starters' />
                  </Form.Item>

                  <Form.Item
                    name='displayOrder'
                    label='Display Order'
                    tooltip='Lower numbers appear first. Leave empty to append at the end.'
                  >
                    <InputNumber min={0} style={{ width: '100%' }} placeholder='Optional' />
                  </Form.Item>

                  <Form.Item
                    name='type'
                    label='Type'
                  >
                    <Select>
                      <Option value='child'>Child</Option>
                      <Option value='parent'>Parent</Option>
                    </Select>
                  </Form.Item>

                  <Divider />
                  <Text strong>Items in this category</Text>
                  <div style={{ maxHeight: 280, overflow: 'auto', marginTop: 8, padding: 8, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                    <Space size='small' wrap>
                      {filteredItems.map(item => (
                        <Tag
                          key={item._id || item.id}
                          color='cyan'
                          style={{ margin: 0, cursor: moveTargetId ? 'grab' : 'default' }}
                          draggable={!!moveTargetId}
                          onDragStart={() => setDraggingItemId(item._id || item.id)}
                          onDragEnd={() => {
                            setDraggingItemId(null);
                            setIsOverDrop(false);
                          }}
                        >
                          {item.name || 'Untitled item'}
                        </Tag>
                      ))}
                      {filteredItems.length === 0 && <Empty description='No items available in this category' />}
                    </Space>
                  </div>
                  {/* <Text type='secondary'>Select which items belong to this category.</Text> */}

                  <Divider />
                  <Text strong>Move items to another category</Text>
                  <Form.Item style={{ marginTop: 8, marginBottom: 12 }}>
                    <Select
                      placeholder='Select target category'
                      value={moveTargetId}
                      onChange={setMoveTargetId}
                      style={{ width: '100%' }}
                    >
                      {sortedCategories
                        .filter(cat => normalizeId(cat._id || cat.id) !== normalizeId(selectedCategory?._id || selectedCategory?.id))
                        .map(cat => (
                          <Option key={cat._id || cat.id} value={cat._id || cat.id}>
                            {cat.name}
                          </Option>
                        ))}
                    </Select>
                  </Form.Item>
                  <div
                    style={{
                      maxHeight: 160,
                      overflow: 'auto',
                      padding: 12,
                      border: '1px dashed #d9d9d9',
                      borderRadius: 8,
                      background: isOverDrop ? '#e6f4ff' : '#fafafa',
                      transition: 'background 0.2s'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (moveTargetId) setIsOverDrop(true);
                    }}
                    onDragLeave={() => setIsOverDrop(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (moveTargetId) handleMoveDrop();
                    }}
                  >
                    <Text type='secondary'>
                      {moveTargetId
                        ? 'Drag an item tag here to move it to the selected category.'
                        : 'Select a target category, then drag an item tag here to move it.'}
                    </Text>
                  </div>
                  {targetCategory && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>Items in target category</Text>
                      <div style={{ maxHeight: 160, overflow: 'auto', marginTop: 8, padding: 8, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                        <Space size='small' wrap>
                          {targetItems.map(item => (
                            <Tag key={item._id || item.id} color='green'>
                              {item.name || 'Untitled item'}
                            </Tag>
                          ))}
                          {targetItems.length === 0 && <Empty description='No items in target category' />}
                        </Space>
                      </div>
                    </div>
                  )}

                  <Space style={{ marginTop: 16 }}>
                    <Button type='primary' onClick={handleSave} loading={updating || updatingItems}>Save</Button>
                  </Space>
                </Form>
                )
              : <Empty description='Select a category to edit' />}
          </Card>
        </Col>
      </Row>

      <Modal
        title='Create New Category'
        open={open}
        onOk={handleCreate}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        confirmLoading={creating}
        destroyOnClose
      >
        <Form
          form={form}
          layout='vertical'
          initialValues={{
            type: 'child',
            displayOrder: null
          }}
        >
          <Form.Item
            name='name'
            label='Name'
            rules={[{ required: true, message: 'Please enter a category name' }]}
          >
            <Input placeholder='e.g. Starters' />
          </Form.Item>

          <Form.Item
            name='displayOrder'
            label='Display Order'
            tooltip='Lower numbers appear first. Leave empty to append at the end.'
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder='Optional' />
          </Form.Item>

          <Form.Item
            name='type'
            label='Type'
          >
            <Select>
              <Option value='child'>Child</Option>
              <Option value='parent'>Parent</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
