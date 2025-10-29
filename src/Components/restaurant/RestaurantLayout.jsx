import { Layout } from 'antd';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { useState, useMemo } from 'react';
import SidebarNav from './SidebarNav';
import Topbar from './Topbar';

const { Sider, Content } = Layout;

export default function RestaurantLayout () {
  const { rid } = useParams();
  const { state } = useLocation();
  const restaurant = state?.restaurant;

  const [collapsed, setCollapsed] = useState(false);
  const navState = useMemo(() => (restaurant ? { restaurant } : undefined), [restaurant]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f6f7f9' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedWidth={72}
        width={220}
        trigger={null}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          // 👇 make sidebar sticky & self-scrolling when needed
          position: 'sticky',
          top: 0,
          height: '100dvh',
          overflow: 'hidden' // inner menu will manage its own scrolling
        }}
      >
        <SidebarNav
          rid={rid}
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
          navState={navState}
          restaurant={restaurant}
        />
      </Sider>

      <Layout style={{ background: '#f6f7f9' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f6f7f9' }}>
          <Topbar />
        </div>

        <Content style={{ padding: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
