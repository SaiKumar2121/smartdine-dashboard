import { useRestaurants } from '../hooks/useRestaurants';
import { Row, Col, Spin, Empty, Button, Space, Typography } from 'antd';
import RestaurantCard from '../Components/RestaurantCard';

const { Title, Text } = Typography;

export default function Home () {
  const { data, isLoading, isError, error, refetch, isFetching } = useRestaurants();

  if (isLoading) {
    return <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}><Spin size='large' /></div>;
  }

  if (isError) {
    return (
      <div style={{ padding: 16 }}>
        <Space direction='vertical'>
          <Title level={4}>Failed to load restaurants</Title>
          <Text type='danger'>{error?.message}</Text>
          <Button onClick={refetch}>Retry</Button>
        </Space>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div style={{ padding: 16 }}>
        <Empty description='No restaurants found' />
        <Button onClick={refetch} loading={isFetching} style={{ marginTop: 12 }}>Refresh</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Restaurants</Title>
        <Button onClick={refetch} loading={isFetching}>Refresh</Button>
      </Space>

      <Row gutter={[16, 16]}>
        {data.map(r => (
          <Col xs={24} sm={12} md={8} lg={6} key={r._id}>
            <RestaurantCard restaurant={r} />
          </Col>
        ))}
      </Row>
    </div>
  );
}
