import React, { useState } from 'react';
import { Table, Button, Tag, Space, Modal, message, Image, Form, Input, Select, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import AdminLayout from '../../components/Layout/AdminLayout';

// Dữ liệu giả lập ban đầu
const INITIAL_DATA = [
  { key: '1', name: "Sân DAU 1", type: "5 người", price: 200000, status: "Hoạt động", image: "https://chihaosport.vn/wp-content/uploads/2022/08/thiet-ke-san-bong-da-dat-chuan.jpg" },
  { key: '2', name: "Sân DAU 2", type: "7 người", price: 300000, status: "Hoạt động", image: "https://bizweb.dktcdn.net/100/017/070/files/kich-thuoc-san-bong-da-1-jpeg.jpg?v=1671246300021" },
  { key: '3', name: "Sân Futsal VIP", type: "Futsal", price: 250000, status: "Bảo trì", image: "https://i.ytimg.com/vi/_zT-g-J30WA/maxresdefault.jpg" },
];

const PitchManager = () => {
  const [data, setData] = useState(INITIAL_DATA);
  const [isModalOpen, setIsModalOpen] = useState(false); // State mở/đóng Modal
  const [form] = Form.useForm(); // Hook quản lý Form

  // Xử lý khi nhấn nút Lưu (Create)
  const handleCreate = (values) => {
    // Tạo dữ liệu mới (giả lập ID ngẫu nhiên)
    const newPitch = {
      key: Date.now().toString(),
      name: values.name,
      type: values.type,
      price: values.price,
      status: "Hoạt động",
      image: values.image || "https://via.placeholder.com/150" // Ảnh mặc định nếu không nhập
    };

    setData([...data, newPitch]); // Thêm vào danh sách
    message.success('Thêm sân mới thành công!');
    setIsModalOpen(false); // Đóng Modal
    form.resetFields(); // Reset form trắng
  };

  // Xử lý xóa sân
  const handleDelete = (key) => {
    Modal.confirm({
      title: 'Bạn có chắc chắn muốn xóa sân này?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        const newData = data.filter(item => item.key !== key);
        setData(newData);
        message.success('Đã xóa sân bóng thành công');
      }
    });
  };

  // Cấu hình cột cho bảng
  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      render: (src) => <Image src={src} width={80} height={50} className="rounded object-cover" />,
    },
    { title: 'Tên sân', dataIndex: 'name', key: 'name', render: text => <b className="text-blue-700">{text}</b> },
    { 
      title: 'Loại sân', 
      dataIndex: 'type', 
      key: 'type',
      render: type => <Tag color={type === '5 người' ? 'green' : type === '7 người' ? 'blue' : 'purple'}>{type}</Tag>
    },
    { 
      title: 'Giá/Giờ', 
      dataIndex: 'price', 
      key: 'price', 
      render: price => `${price.toLocaleString()}đ` 
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: status => <Tag color={status === 'Hoạt động' ? 'success' : 'error'}>{status}</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} type="primary" ghost>Sửa</Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.key)}>Xóa</Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Quản lý danh sách sân bóng</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large" 
          className="bg-green-600 hover:bg-green-500"
          onClick={() => setIsModalOpen(true)} // Mở Modal khi bấm
        >
          Thêm sân mới
        </Button>
      </div>
      
      <Table columns={columns} dataSource={data} pagination={{ pageSize: 5 }} />

      {/* MODAL THÊM SÂN MỚI */}
      <Modal
        title="Thêm sân bóng mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null} // Ẩn nút mặc định để dùng nút trong Form
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ type: '5 người', price: 200000 }}
        >
          <Form.Item
            name="name"
            label="Tên sân bóng"
            rules={[{ required: true, message: 'Vui lòng nhập tên sân!' }]}
          >
            <Input placeholder="Ví dụ: Sân DAU 3" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="type"
              label="Loại sân"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="5 người">Sân 5 người</Select.Option>
                <Select.Option value="7 người">Sân 7 người</Select.Option>
                <Select.Option value="11 người">Sân 11 người</Select.Option>
                <Select.Option value="Futsal">Sân Futsal</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="price"
              label="Giá thuê (VNĐ/h)"
              rules={[{ required: true, message: 'Nhập giá tiền!' }]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="image"
            label="Link hình ảnh (URL)"
            rules={[{ required: true, message: 'Vui lòng dán link ảnh!' }]}
          >
            <Input prefix={<UploadOutlined />} placeholder="https://..." />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space className="w-full justify-end">
               <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
               <Button type="primary" htmlType="submit" className="bg-blue-600">
                 Lưu sân bóng
               </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
};

export default PitchManager;