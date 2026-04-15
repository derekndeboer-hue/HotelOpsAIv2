import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface SystemSettings {
  morningShiftStart: string;
  morningShiftEnd: string;
  afternoonShiftStart: string;
  afternoonShiftEnd: string;
  eveningShiftStart: string;
  eveningShiftEnd: string;
  dndDelayMinutes: string;
  pmWindowDays: string;
  checkInTime: string;
  checkOutTime: string;
  inspectionRequired: boolean;
  maxRoomsPerHousekeeper: string;
  avgCleaningMinutes: string;
}

const defaults: SystemSettings = {
  morningShiftStart: '07:00',
  morningShiftEnd: '15:00',
  afternoonShiftStart: '15:00',
  afternoonShiftEnd: '23:00',
  eveningShiftStart: '23:00',
  eveningShiftEnd: '07:00',
  dndDelayMinutes: '120',
  pmWindowDays: '7',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  inspectionRequired: true,
  maxRoomsPerHousekeeper: '14',
  avgCleaningMinutes: '30',
};

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaults);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update(key: keyof SystemSettings, value: string | boolean) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Simulate save
    await new Promise(r => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="page-container max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Shift times */}
        <Card>
          <CardHeader title="Shift Configuration" subtitle="Define shift start and end times" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Morning Start" type="time" value={settings.morningShiftStart} onChange={e => update('morningShiftStart', e.target.value)} />
              <Input label="Morning End" type="time" value={settings.morningShiftEnd} onChange={e => update('morningShiftEnd', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Afternoon Start" type="time" value={settings.afternoonShiftStart} onChange={e => update('afternoonShiftStart', e.target.value)} />
              <Input label="Afternoon End" type="time" value={settings.afternoonShiftEnd} onChange={e => update('afternoonShiftEnd', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Evening Start" type="time" value={settings.eveningShiftStart} onChange={e => update('eveningShiftStart', e.target.value)} />
              <Input label="Evening End" type="time" value={settings.eveningShiftEnd} onChange={e => update('eveningShiftEnd', e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Front desk */}
        <Card>
          <CardHeader title="Front Desk" subtitle="Check-in/out and guest policies" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Check-in Time" type="time" value={settings.checkInTime} onChange={e => update('checkInTime', e.target.value)} />
            <Input label="Check-out Time" type="time" value={settings.checkOutTime} onChange={e => update('checkOutTime', e.target.value)} />
          </div>
        </Card>

        {/* Housekeeping */}
        <Card>
          <CardHeader title="Housekeeping" subtitle="Cleaning and inspection settings" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Max Rooms per Housekeeper" type="number" value={settings.maxRoomsPerHousekeeper} onChange={e => update('maxRoomsPerHousekeeper', e.target.value)} />
              <Input label="Avg Cleaning (minutes)" type="number" value={settings.avgCleaningMinutes} onChange={e => update('avgCleaningMinutes', e.target.value)} />
            </div>
            <Input label="DND Delay (minutes)" type="number" value={settings.dndDelayMinutes} onChange={e => update('dndDelayMinutes', e.target.value)} helperText="How long before DND rooms get flagged for follow-up" />
            <div className="flex items-center gap-3">
              <input type="checkbox" id="inspectionRequired" checked={settings.inspectionRequired} onChange={e => update('inspectionRequired', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="inspectionRequired" className="text-sm font-medium text-gray-700">Require inspection before marking rooms ready</label>
            </div>
          </div>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardHeader title="Maintenance" subtitle="Preventive maintenance scheduling" />
          <Input label="PM Window (days)" type="number" value={settings.pmWindowDays} onChange={e => update('pmWindowDays', e.target.value)} helperText="Days before due date to start PM work orders" />
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4" /> Save Settings
          </Button>
          {saved && <span className="text-sm text-green-600">Settings saved successfully</span>}
        </div>
      </form>
    </div>
  );
}
