// src/Components/RestaurantCard.jsx
import { Card, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Paragraph, Text } = Typography;

export default function RestaurantCard ({ restaurant }) {
  // Expecting a normalized object from your API layer
  const { _id, id, name, description, status } = restaurant || {};
  const rid = _id || id;
  const navigate = useNavigate();

  const color =
    String(status || '').toLowerCase() === 'active'
      ? 'success'
      : String(status || '').toLowerCase() === 'inactive'
        ? 'default'
        : 'warning';

  return (
    <Card
      title={name || 'Untitled Restaurant'}
      extra={<Tag color={color}>{status || 'unknown'}</Tag>}
      hoverable
      onClick={() =>
        navigate(`/restaurants/${rid}/menu`, {
          state: { restaurant } // pass along so header/sidebar can use name/logo immediately
        })}
    >
      <Paragraph type='secondary' style={{ marginBottom: 8 }}>
        <Text strong>Restaurant ID: </Text>
        <Text code>{rid || 'N/A'}</Text>
      </Paragraph>

      {description
        ? <Paragraph ellipsis={{ rows: 3 }}>{description}</Paragraph>
        : <Text type='secondary'>No description provided.</Text>}
    </Card>
  );
}
