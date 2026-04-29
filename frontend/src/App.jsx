import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Layout,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
  message
} from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  LogoutOutlined,
  PlusOutlined,
  UserOutlined
} from '@ant-design/icons'
import {
  clearToken,
  createContact,
  deleteContact,
  getContacts,
  getMe,
  getToken,
  loginUser,
  registerUser,
  setToken,
  updateContact
} from './api'

const { Header, Content } = Layout
const { Title, Text } = Typography

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const isLogin = mode === 'login'

  async function handleSubmit(values) {
    setLoading(true)
    try {
      if (isLogin) {
        const data = await loginUser(values)
        setToken(data.access_token)
        message.success('Autentificare reusita')
        onAuthenticated()
      } else {
        await registerUser(values)
        message.success('Cont creat cu succes. Va puteti autentifica.')
        setMode('login')
        form.resetFields()
      }
    } catch (error) {
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout className="auth-layout">
      <Content className="auth-content">
        <Card className="auth-card">
          <Space direction="vertical" size="large" className="full-width">
            <div className="centered">
              <Title level={2}>Contact Manager</Title>
              <Text type="secondary">
                {isLogin ? 'Autentificare in aplicatie' : 'Creare cont nou'}
              </Text>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
              <Form.Item
                label="Nume utilizator"
                name="username"
                rules={[
                  { required: true, message: 'Introduceti numele de utilizator' },
                  { min: 3, max: 50, message: 'Numele de utilizator trebuie sa aiba 3-50 caractere' }
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="bogdan" autoComplete="username" />
              </Form.Item>

              <Form.Item
                label="Parola"
                name="password"
                rules={[
                  { required: true, message: 'Introduceti parola' },
                  { min: 8, max: 100, message: 'Parola trebuie sa aiba 8-100 caractere' }
                ]}
              >
                <Input.Password placeholder="password123" autoComplete="current-password" />
              </Form.Item>

              <Button type="primary" htmlType="submit" block loading={loading}>
                {isLogin ? 'Autentificare' : 'Inregistrare'}
              </Button>
            </Form>

            <Button type="link" onClick={() => setMode(isLogin ? 'register' : 'login')}>
              {isLogin ? 'Nu aveti cont? Inregistrare' : 'Aveti deja cont? Autentificare'}
            </Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  )
}

function ContactModal({ open, contact, onCancel, onSave }) {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const requirePhoneOrEmail = (_, value) => {
    const phoneValue = form.getFieldValue('phone')
    const emailValue = form.getFieldValue('email')
    const hasValue = (currentValue) => typeof currentValue === 'string' && currentValue.trim().length > 0

    if (hasValue(value) || hasValue(phoneValue) || hasValue(emailValue)) {
      return Promise.resolve()
    }
    return Promise.reject(new Error('Completati cel putin Telefon sau Email'))
  }

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        contact || {
          name: '',
          phone: '',
          email: '',
          notes: ''
        }
      )
    }
  }, [contact, form, open])

  async function handleSave() {
    const values = await form.validateFields()
    setSaving(true)
    try {
      await onSave(values)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={contact ? 'Detalii / Editare contact' : 'Adaugare contact'}
      open={open}
      onCancel={onCancel}
      onOk={handleSave}
      confirmLoading={saving}
      okText="Salveaza"
      cancelText="Anuleaza"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          label="Nume"
          name="name"
          rules={[{ required: true, message: 'Numele este obligatoriu' }]}
        >
          <Input placeholder="Ion Popescu" />
        </Form.Item>
        <Form.Item
          label="Telefon"
          name="phone"
          dependencies={['email']}
          getValueFromEvent={(event) => event.target.value.replace(/\D/g, '')}
          rules={[
            { validator: requirePhoneOrEmail }
          ]}
        >
          <Input inputMode="numeric" placeholder="06873..." />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          dependencies={['phone']}
          rules={[
            {
              validator: (_, value) => {
                if (!value || value.includes('@')) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Email-ul trebuie sa contina @'))
              }
            },
            { validator: requirePhoneOrEmail }
          ]}
        >
          <Input placeholder="ion@example.com" />
        </Form.Item>
        <Form.Item label="Note" name="notes">
          <Input.TextArea rows={4} placeholder="Prieten de la facultate" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function ContactsScreen({ user, onLogout }) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)

  async function loadContacts() {
    setLoading(true)
    try {
      const data = await getContacts()
      setContacts(data)
    } catch (error) {
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return contacts
    }

    return contacts.filter((contact) =>
      [contact.name, contact.phone, contact.email].some((value) =>
        (value || '').toLowerCase().includes(query)
      )
    )
  }, [contacts, search])

  function openCreateModal() {
    setSelectedContact(null)
    setModalOpen(true)
  }

  function openEditModal(contact) {
    setSelectedContact(contact)
    setModalOpen(true)
  }

  async function handleSave(values) {
    try {
      if (selectedContact) {
        await updateContact(selectedContact.id, values)
        message.success('Contact actualizat')
      } else {
        await createContact(values)
        message.success('Contact creat')
      }
      setModalOpen(false)
      await loadContacts()
    } catch (error) {
      message.error(error.message)
      throw error
    }
  }

  async function handleDelete(contactId) {
    try {
      await deleteContact(contactId)
      message.success('Contact sters')
      await loadContacts()
    } catch (error) {
      message.error(error.message)
    }
  }

  const columns = [
    {
      title: 'Nume',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      render: (value) => value || '-'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (value) => value || '-'
    },
    {
      title: 'Actiuni',
      key: 'actions',
      render: (_, contact) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(contact)}>
            Vezi/Editeaza
          </Button>
          <Popconfirm
            title="Stergeti contactul?"
            description="Aceasta actiune nu poate fi anulata."
            okText="Da"
            cancelText="Nu"
            onConfirm={() => handleDelete(contact.id)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Sterge
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <Title level={3} className="header-title">
          Contact Manager
        </Title>
        <Space>
          <Text className="header-user">Utilizator: {user.username}</Text>
          <Button icon={<LogoutOutlined />} onClick={onLogout}>
            Deconectare
          </Button>
        </Space>
      </Header>

      <Content className="app-content">
        <Card>
          <Space direction="vertical" size="large" className="full-width">
            <Space className="toolbar" wrap>
              <Input.Search
                allowClear
                placeholder="Cautare dupa nume, telefon sau email"
                onChange={(event) => setSearch(event.target.value)}
                className="search-input"
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                Adauga contact
              </Button>
            </Space>

            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredContacts}
              loading={loading}
              locale={{ emptyText: <Empty description="Nu exista contacte" /> }}
              pagination={{ pageSize: 6 }}
            />
          </Space>
        </Card>
      </Content>

      <ContactModal
        open={modalOpen}
        contact={selectedContact}
        onCancel={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </Layout>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  async function loadCurrentUser() {
    if (!getToken()) {
      setCheckingSession(false)
      return
    }

    try {
      const data = await getMe()
      setUser(data)
    } catch {
      clearToken()
      setUser(null)
    } finally {
      setCheckingSession(false)
    }
  }

  useEffect(() => {
    loadCurrentUser()

    function handleExpiredAuth() {
      setUser(null)
      message.warning('Sesiunea a expirat. Autentificati-va din nou.')
    }

    window.addEventListener('auth-expired', handleExpiredAuth)
    return () => window.removeEventListener('auth-expired', handleExpiredAuth)
  }, [])

  function handleLogout() {
    clearToken()
    setUser(null)
    message.info('Ati iesit din cont')
  }

  if (checkingSession) {
    return (
      <Layout className="auth-layout">
        <Content className="auth-content">
          <Card>Se verifica sesiunea...</Card>
        </Content>
      </Layout>
    )
  }

  if (!user) {
    return <AuthScreen onAuthenticated={loadCurrentUser} />
  }

  return <ContactsScreen user={user} onLogout={handleLogout} />
}
