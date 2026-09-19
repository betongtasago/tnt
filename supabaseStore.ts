import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppState } from './src/types';

const TABLE_NAME = 'app_state';
const ROW_ID = 'default';
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim();
export const supabaseConfigured = Boolean(supabaseUrl && serviceRoleKey);
const supabase: SupabaseClient | null = supabaseConfigured ? createClient(supabaseUrl!, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } }) : null;

function rowToState(row: any, fallback: AppState): AppState {
  return {
    vehicles: Array.isArray(row?.vehicles) ? row.vehicles : fallback.vehicles,
    config: row?.config && typeof row.config === 'object' ? row.config : fallback.config,
    notificationLogs: Array.isArray(row?.notification_logs) ? row.notification_logs : fallback.notificationLogs,
    lastCronDate: row?.last_cron_date || fallback.lastCronDate,
    lastCronLog: row?.last_cron_log || fallback.lastCronLog,
  };
}
function stateToRow(state: AppState) { return { id: ROW_ID, vehicles: state.vehicles || [], config: state.config || {}, notification_logs: state.notificationLogs || [], last_cron_date: state.lastCronDate || '', last_cron_log: state.lastCronLog || '', updated_at: new Date().toISOString() }; }
function describeError(error: any) { return error?.message || error?.details || error?.hint || 'Lỗi Supabase không xác định'; }

export async function loadSupabaseState(fallback: AppState): Promise<AppState> {
  if (!supabase) return fallback;
  const { data, error } = await supabase.from(TABLE_NAME).select('id, vehicles, config, notification_logs, last_cron_date, last_cron_log').eq('id', ROW_ID).maybeSingle();
  if (error) throw new Error(`Không thể đọc dữ liệu Supabase: ${describeError(error)}`);
  if (data) return rowToState(data, fallback);
  const { data: inserted, error: insertError } = await supabase.from(TABLE_NAME).upsert(stateToRow(fallback), { onConflict: 'id' }).select('id, vehicles, config, notification_logs, last_cron_date, last_cron_log').single();
  if (insertError || !inserted) throw new Error(`Không thể khởi tạo dữ liệu Supabase: ${describeError(insertError)}`);
  return rowToState(inserted, fallback);
}
export async function persistSupabaseState(state: AppState) {
  if (!supabase) return;
  const { error } = await supabase.from(TABLE_NAME).upsert(stateToRow(state), { onConflict: 'id' });
  if (error) throw new Error(`Không thể ghi dữ liệu Supabase: ${describeError(error)}`);
}
export function subscribeSupabaseState(onState: (state: AppState) => void): (() => void) | null {
  if (!supabase) return null;
  const channel = supabase.channel('tnt-fleet-state-sync').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLE_NAME, filter: `id=eq.${ROW_ID}` }, payload => onState(rowToState(payload.new, { vehicles: [], config: { autoEmailEnabled: true, emailRecipients: [], emailSender: 'Tasago Fleet', reminderDaysBefore: 30, autoSendHour: 7, autoSendMinute: 0 }, notificationLogs: [], lastCronDate: '', lastCronLog: '' }))).subscribe();
  return () => { void supabase.removeChannel(channel); };
}
