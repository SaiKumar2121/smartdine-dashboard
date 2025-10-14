import { Typography, Space, Button } from 'antd';
import { useMatches, Link } from 'react-router-dom';
const { Title } = Typography;

function getSectionTitle (matches) {
  const m = [...matches].reverse().find(x => x.handle?.title);
  return m?.handle?.title ?? '';
}

export default function Topbar () {
  const matches = useMatches();
  const title = getSectionTitle(matches);

  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ margin: 0 }}>{title}</Title>

        <Space size='middle'>
          <Button><Link to='/'>Back to Restaurants</Link></Button>
        </Space>
      </div>
    </div>
  );
}
