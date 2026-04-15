import { useEffect, useState } from 'react';
import { Plus, UserCog, X } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ROLE_DISPLAY_NAMES } from '@/utils/constants';
import type { StaffMember, Role } from '@/types';

const ROLE_OPTIONS: { value: Role; label: string }[] = Object.entries(ROLE_DISPLAY_NAMES).map(
  ([value, label]) => ({ value: value as Role, label })
);

export function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<Role>('housekeeper');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.staff.list().then(setStaff).catch(console.error).finally(() => setLoading(false));
  }, []);

  function openAdd() {
    setEditingId(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('housekeeper');
    setModalOpen(true);
  }

  function openEdit(s: StaffMember) {
    setEditingId(s.id);
    setFormName(s.name);
    setFormEmail(s.email);
    setFormPhone(s.phone || '');
    setFormRole(s.role);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.staff.update(editingId, { name: formName, email: formEmail, phone: formPhone, role: formRole });
        setStaff(prev => prev.map(s => s.id === editingId ? updated : s));
      } else {
        const created = await api.staff.create({ name: formName, email: formEmail, phone: formPhone, role: formRole, active: true });
        setStaff(prev => [...prev, created]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this staff member?')) return;
    try {
      await api.staff.deactivate(id);
      setStaff(prev => prev.map(s => s.id === id ? { ...s, active: false } : s));
    } catch (err) {
      console.error(err);
    }
  }

  const columns: Column<StaffMember & Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => <span className="text-gray-600">{row.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <Badge variant="info">{ROLE_DISPLAY_NAMES[row.role as Role]}</Badge>,
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.active ? 'success' : 'muted'}>
          {row.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => openEdit(row as StaffMember)}>Edit</Button>
          {row.active && (
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeactivate(row.id as string)}>
              Deactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="page-container">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500">{staff.filter(s => s.active).length} active, {staff.filter(s => !s.active).length} inactive</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      <Card padding={false}>
        <DataTable
          columns={columns}
          data={staff as (StaffMember & Record<string, unknown>)[]}
          keyExtractor={r => r.id as string}
        />
      </Card>

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Staff Member' : 'Add Staff Member'}
      >
        <div className="space-y-4">
          <Input label="Full Name" value={formName} onChange={e => setFormName(e.target.value)} required />
          <Input label="Email" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required />
          <Input label="Phone" type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
          <Select label="Role" options={ROLE_OPTIONS} value={formRole} onChange={e => setFormRole(e.target.value as Role)} />
          <div className="flex gap-3 pt-2">
            <Button loading={saving} onClick={handleSave} disabled={!formName || !formEmail}>
              {editingId ? 'Update' : 'Create'}
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
