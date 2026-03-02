import React, { useContext, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useMutation, useQuery } from './src/platform-hooks';

const SCHOOL_NAME = 'E.M.E.F Professor Célio Corradi';
const APP_TITLE = 'Serviços e Manutenção Escolar';

const ROOMS_LIST = [
  '1ºA - Carol Ishida', '1ºB - Renata', '2ºA - Juliana', '2ºB - Cristiane', '3ºA - Kamila', '3ºB - Márcia',
  '4ºA - Susimar', '4ºB - Sonia', '5ºA - Flávia', '5ºB - Carol Muzy', 'Cozinha', 'Coordenação', 'Direção',
  'Vice Direção', 'Secretaria', 'Limpeza', 'Educação Física', 'A.D.E - Leny, Elizangêla',
];

const FORWARD_OPTIONS = ['Direção', 'Vice Direção', 'Coordenação', 'Secretaria', 'Cozinha'];
const PRIORITIES = [
  { key: 'high', label: 'Alta', color: '#EF4444' },
  { key: 'medium', label: 'Média', color: '#F59E0B' },
  { key: 'low', label: 'Baixa', color: '#10B981' },
  { key: 'veryLow', label: 'Muito Baixa', color: '#3B82F6' },
];

const ThemeContext = React.createContext();
const Tab = createBottomTabNavigator();

const improveDescription = (text) => {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const firstUpper = clean.charAt(0).toUpperCase() + clean.slice(1);
  const ensured = /[.!?]$/.test(firstUpper) ? firstUpper : `${firstUpper}.`;
  return `Identificou-se a seguinte situação: ${ensured} Solicita-se avaliação e providências de manutenção.`;
};

const dateTimePt = (iso) => {
  if (!iso) return { date: '-', time: '-' };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('pt-BR'),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
};

async function pickImage(fromCamera = false) {
  const permission = fromCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permissão', 'Permissão de foto não concedida.');
    return null;
  }

  const result = fromCamera
    ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true })
    : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true });

  if (result.canceled) return null;
  return result.assets?.[0]?.uri || null;
}

async function uriToEmbeddedImage(uri) {
  if (!uri) return '';
  if (uri.startsWith('data:image')) return uri;
  if (Platform.OS === 'web') return uri;
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return uri;
  }
}

async function generatePdfAndShare(html) {
  const { uri } = await Print.printToFileAsync({ html });
  if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar PDF' });
  } else {
    await Share.share({ message: `PDF gerado: ${uri}` });
  }
}

function BottomSpacer() {
  const insets = useSafeAreaInsets();
  return <View style={{ height: Math.max(insets.bottom + 20, 36) }} />;
}

function ScreenContainer({ children }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.container, { paddingTop: insets.top + 8 }]}>{children}</View>;
}

function ThemeProvider({ children }) {
  const theme = useMemo(() => ({
    colors: {
      primary: '#2E86AB',
      accent: '#F39801',
      background: '#F8FAFC',
      card: '#FFFFFF',
      textPrimary: '#1E293B',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      success: '#10B981',
      error: '#EF4444',
    },
  }), []);
  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
}

const useTheme = () => useContext(ThemeContext);

function PhotoPickerSection({ photo, setPhoto, title }) {
  const { theme } = useTheme();
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.colors.textPrimary }]}>{title}</Text>
      <View style={styles.rowGap}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: theme.colors.primary }]} onPress={async () => setPhoto(await pickImage(true))}>
          <MaterialIcons name="camera-alt" size={20} color="#fff" />
          <Text style={styles.bigButtonText}>Tirar Foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: theme.colors.accent }]} onPress={async () => setPhoto(await pickImage(false))}>
          <MaterialIcons name="photo-library" size={20} color="#fff" />
          <Text style={styles.bigButtonText}>Galeria</Text>
        </TouchableOpacity>
      </View>
      {photo ? <Image source={{ uri: photo }} style={styles.preview} /> : null}
    </View>
  );
}

function DescriptionInput({ value, setValue, placeholder }) {
  const { theme } = useTheme();
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Descrição</Text>
      <TextInput
        style={[styles.textArea, { borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
        multiline
        value={value}
        onChangeText={setValue}
        onSubmitEditing={() => setValue((prev) => `${prev}\n• `)}
        blurOnSubmit={false}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
      />
      <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.colors.primary }]} onPress={() => setValue((prev) => improveDescription(prev))}>
        <MaterialIcons name="auto-fix-high" size={18} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontWeight: '700', marginLeft: 6 }}>Melhorar Descrição</Text>
      </TouchableOpacity>
    </View>
  );
}

function TarefasScreen() {
  const { theme } = useTheme();
  const { data: tasks = [], loading, refetch } = useQuery('tasks', { status: 'active' }, { column: 'createdAt', ascending: false });
  const { mutate: insertTask } = useMutation('tasks', 'insert');
  const { mutate: updateTask } = useMutation('tasks', 'update');

  const [showModal, setShowModal] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [completionPhoto, setCompletionPhoto] = useState(null);

  const [room, setRoom] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('high');
  const [photo, setPhoto] = useState(null);

  const sorted = useMemo(() => {
    const order = { high: 0, medium: 1, low: 2, veryLow: 3 };
    return [...tasks].sort((a, b) => order[a.priority] - order[b.priority]);
  }, [tasks]);

  const saveTask = async () => {
    if (!room || !description.trim()) return Alert.alert('Erro', 'Preencha os campos obrigatórios.');
    await insertTask({ room, description: description.trim(), priority, photo, status: 'active', createdAt: new Date().toISOString() });
    setRoom(''); setDescription(''); setPriority('high'); setPhoto(null); setShowModal(false); refetch();
  };

  const concludeTask = async () => {
    if (!selectedTask) return;
    await updateTask({ id: selectedTask.id, data: { status: 'completed', completedAt: new Date().toISOString(), completionPhoto } });
    setShowComplete(false); setSelectedTask(null); setCompletionPhoto(null); refetch();
  };

  const taskPdfHtml = async (task) => {
    const before = await uriToEmbeddedImage(task.photo);
    const after = await uriToEmbeddedImage(task.completionPhoto);
    const created = dateTimePt(task.createdAt);
    const completed = dateTimePt(task.completedAt);
    const p = PRIORITIES.find((x) => x.key === task.priority)?.label || '-';
    return `
      <html><body style="font-family:Arial;padding:20px;">
      <h2>${APP_TITLE}</h2><h3>${SCHOOL_NAME}</h3><hr/>
      <p><b>Tipo:</b> Tarefa</p>
      <p><b>Local:</b> ${task.room || '-'}</p>
      <p><b>Descrição:</b> ${task.description || '-'}</p>
      <p><b>Prioridade:</b> ${p}</p>
      <p><b>Data criação:</b> ${created.date} <b>Hora:</b> ${created.time}</p>
      <p><b>Data conclusão:</b> ${completed.date} <b>Hora:</b> ${completed.time}</p>
      ${before ? `<p><b>Foto do problema:</b></p><img src="${before}" style="max-width:100%;height:auto;border:1px solid #ddd;"/>` : ''}
      ${after ? `<p><b>Foto de conclusão:</b></p><img src="${after}" style="max-width:100%;height:auto;border:1px solid #ddd;"/>` : ''}
      </body></html>`;
  };

  if (loading) return <ScreenContainer><Text style={styles.loadingText}>Carregando tarefas...</Text></ScreenContainer>;

  return (
    <ScreenContainer>
      <View style={styles.header}><Text style={styles.screenTitle}>Tarefas</Text>
        <TouchableOpacity style={[styles.headerButton, { backgroundColor: theme.colors.primary }]} onPress={() => setShowModal(true)}><Text style={styles.headerButtonText}>NOVA TAREFA</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {sorted.map((t) => {
          const created = dateTimePt(t.createdAt);
          const p = PRIORITIES.find((x) => x.key === t.priority);
          return (
            <View key={t.id} style={[styles.card, { borderColor: theme.colors.border }]}>
              <Text style={styles.itemTitle}>{t.room}</Text>
              <Text style={styles.itemText}>{t.description}</Text>
              <View style={[styles.badge, { backgroundColor: p?.color }]}><Text style={styles.badgeText}>{p?.label}</Text></View>
              <Text style={styles.meta}>Data: {created.date}  Hora: {created.time}</Text>
              {t.photo ? <Image source={{ uri: t.photo }} style={styles.photo} /> : null}
              <View style={styles.rowGap}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.success }]} onPress={() => { setSelectedTask(t); setShowComplete(true); }}><Text style={styles.actionText}>CONCLUIR</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.accent }]} onPress={async () => generatePdfAndShare(await taskPdfHtml(t))}><Text style={styles.actionText}>GERAR PDF</Text></TouchableOpacity>
              </View>
            </View>
          );
        })}
        {sorted.length === 0 ? <Text style={styles.empty}>Nenhuma tarefa ativa.</Text> : null}
        <BottomSpacer />
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Nova Tarefa</Text>
            <Text style={styles.label}>Local</Text>
            <View style={styles.pickerWrap}><Picker selectedValue={room} onValueChange={setRoom}><Picker.Item label="Selecione..." value="" />{ROOMS_LIST.map((r) => <Picker.Item key={r} label={r} value={r} />)}</Picker></View>
            <DescriptionInput value={description} setValue={setDescription} placeholder="Descreva o problema..." />
            <Text style={styles.label}>Prioridade</Text>
            <View style={styles.rowWrap}>{PRIORITIES.map((p) => <TouchableOpacity key={p.key} style={[styles.priorityBtn, { backgroundColor: priority === p.key ? p.color : '#fff', borderColor: p.color }]} onPress={() => setPriority(p.key)}><Text style={{ color: priority === p.key ? '#fff' : p.color, fontWeight: '700' }}>{p.label}</Text></TouchableOpacity>)}</View>
            <PhotoPickerSection photo={photo} setPhoto={setPhoto} title="Foto do Problema" />
            <View style={styles.rowGap}><TouchableOpacity style={styles.cancel} onPress={() => setShowModal(false)}><Text>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.save} onPress={saveTask}><Text style={{ color: '#fff', fontWeight: '700' }}>SALVAR TAREFA</Text></TouchableOpacity></View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showComplete} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Concluir Tarefa</Text>
            <PhotoPickerSection photo={completionPhoto} setPhoto={setCompletionPhoto} title="Foto final (opcional)" />
            <View style={styles.rowGap}><TouchableOpacity style={styles.cancel} onPress={() => setShowComplete(false)}><Text>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.save} onPress={concludeTask}><Text style={{ color: '#fff', fontWeight: '700' }}>CONCLUIR</Text></TouchableOpacity></View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

function OcorrenciasScreen() {
  const { theme } = useTheme();
  const { data: incidents = [], loading, refetch } = useQuery('incidents', { status: 'active' }, { column: 'createdAt', ascending: false });
  const { mutate: insertIncident } = useMutation('incidents', 'insert');
  const { mutate: updateIncident } = useMutation('incidents', 'update');
  const { mutate: deleteIncident } = useMutation('incidents', 'delete');
  const [showModal, setShowModal] = useState(false);
  const [room, setRoom] = useState('');
  const [forwardTo, setForwardTo] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);

  const save = async () => {
    if (!room || !forwardTo || !description.trim()) return Alert.alert('Erro', 'Preencha os campos obrigatórios.');
    await insertIncident({ room, forwardTo, description: description.trim(), photo, createdAt: new Date().toISOString(), status: 'active' });
    setRoom(''); setForwardTo(''); setDescription(''); setPhoto(null); setShowModal(false); refetch();
  };

  const conclude = async (item) => {
    await updateIncident({ id: item.id, data: { status: 'completed', completedAt: new Date().toISOString() } });
    refetch();
  };

  const incidentPdfHtml = async (i) => {
    const img = await uriToEmbeddedImage(i.photo);
    const created = dateTimePt(i.createdAt);
    const completed = dateTimePt(i.completedAt);
    return `
      <html><body style="font-family:Arial;padding:20px;">
      <h2>${APP_TITLE}</h2><h3>${SCHOOL_NAME}</h3><hr/>
      <p><b>Tipo:</b> Ocorrência</p>
      <p><b>Local:</b> ${i.room}</p>
      <p><b>Encaminhado para:</b> ${i.forwardTo}</p>
      <p><b>Descrição:</b> ${i.description}</p>
      <p><b>Data criação:</b> ${created.date} <b>Hora:</b> ${created.time}</p>
      <p><b>Data conclusão:</b> ${completed.date} <b>Hora:</b> ${completed.time}</p>
      ${img ? `<p><b>Foto:</b></p><img src="${img}" style="max-width:100%;height:auto;border:1px solid #ddd;"/>` : ''}
      </body></html>`;
  };

  if (loading) return <ScreenContainer><Text style={styles.loadingText}>Carregando ocorrências...</Text></ScreenContainer>;

  return (
    <ScreenContainer>
      <View style={styles.header}><Text style={styles.screenTitle}>Ocorrências</Text>
        <TouchableOpacity style={[styles.headerButton, { backgroundColor: theme.colors.accent }]} onPress={() => setShowModal(true)}><Text style={styles.headerButtonText}>NOVA OCORRÊNCIA</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {incidents.map((i) => {
          const created = dateTimePt(i.createdAt);
          return (
            <View key={i.id} style={styles.card}>
              <Text style={styles.itemTitle}>{i.room}</Text>
              <Text style={styles.meta}>Encaminhar para: {i.forwardTo}</Text>
              <Text style={styles.itemText}>{i.description}</Text>
              <Text style={styles.meta}>Data: {created.date}  Hora: {created.time}</Text>
              {i.photo ? <Image source={{ uri: i.photo }} style={styles.photo} /> : null}
              <View style={styles.rowWrap}>
                <TouchableOpacity style={[styles.smallAction, { backgroundColor: '#F59E0B' }]} onPress={async () => generatePdfAndShare(await incidentPdfHtml(i))}><Text style={styles.actionText}>GERAR PDF</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.smallAction, { backgroundColor: '#2E86AB' }]} onPress={() => Share.share({ message: `${APP_TITLE}\n${i.room}\n${i.description}` })}><Text style={styles.actionText}>COMPARTILHAR</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.smallAction, { backgroundColor: '#10B981' }]} onPress={() => conclude(i)}><Text style={styles.actionText}>CONCLUIR</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.smallAction, { backgroundColor: '#EF4444' }]} onPress={async () => { await deleteIncident({ id: i.id }); refetch(); }}><Text style={styles.actionText}>EXCLUIR</Text></TouchableOpacity>
              </View>
            </View>
          );
        })}
        {incidents.length === 0 ? <Text style={styles.empty}>Nenhuma ocorrência ativa.</Text> : null}
        <BottomSpacer />
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Nova Ocorrência</Text>
            <Text style={styles.label}>Local</Text>
            <View style={styles.pickerWrap}><Picker selectedValue={room} onValueChange={setRoom}><Picker.Item label="Selecione..." value="" />{ROOMS_LIST.map((r) => <Picker.Item key={r} label={r} value={r} />)}</Picker></View>
            <Text style={styles.label}>Encaminhar para</Text>
            <View style={styles.pickerWrap}><Picker selectedValue={forwardTo} onValueChange={setForwardTo}><Picker.Item label="Selecione..." value="" />{FORWARD_OPTIONS.map((f) => <Picker.Item key={f} label={f} value={f} />)}</Picker></View>
            <DescriptionInput value={description} setValue={setDescription} placeholder="Descreva a ocorrência..." />
            <PhotoPickerSection photo={photo} setPhoto={setPhoto} title="Foto" />
            <View style={styles.rowGap}><TouchableOpacity style={styles.cancel} onPress={() => setShowModal(false)}><Text>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.save} onPress={save}><Text style={{ color: '#fff', fontWeight: '700' }}>SALVAR OCORRÊNCIA</Text></TouchableOpacity></View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

function HistoricoTarefasScreen() {
  const { data: tasks = [], loading, refetch } = useQuery('tasks', { status: 'completed' }, { column: 'completedAt', ascending: false });
  const { mutate: deleteTask } = useMutation('tasks', 'delete');

  const taskPdf = async (t) => generatePdfAndShare(await (async () => {
    const before = await uriToEmbeddedImage(t.photo);
    const after = await uriToEmbeddedImage(t.completionPhoto);
    const c = dateTimePt(t.createdAt);
    const d = dateTimePt(t.completedAt);
    const p = PRIORITIES.find((x) => x.key === t.priority)?.label || '-';
    return `<html><body style="font-family:Arial;padding:20px;"><h2>${APP_TITLE}</h2><h3>${SCHOOL_NAME}</h3><hr/><p><b>Tipo:</b> Tarefa</p><p><b>Local:</b> ${t.room}</p><p><b>Descrição:</b> ${t.description}</p><p><b>Prioridade:</b> ${p}</p><p><b>Data criação:</b> ${c.date} ${c.time}</p><p><b>Data conclusão:</b> ${d.date} ${d.time}</p>${before ? `<img src="${before}" style="max-width:100%"/>` : ''}${after ? `<img src="${after}" style="max-width:100%"/>` : ''}</body></html>`;
  })());

  if (loading) return <ScreenContainer><Text style={styles.loadingText}>Carregando histórico...</Text></ScreenContainer>;

  return (
    <ScreenContainer>
      <View style={styles.header}><Text style={styles.screenTitle}>Histórico de Tarefas</Text></View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {tasks.map((t) => {
          const c = dateTimePt(t.createdAt); const d = dateTimePt(t.completedAt);
          return (
            <View key={t.id} style={styles.card}>
              <Text style={styles.itemTitle}>{t.room}</Text>
              <Text style={styles.itemText}>{t.description}</Text>
              <Text style={styles.meta}>Criação: {c.date} {c.time}</Text>
              <Text style={styles.meta}>Conclusão: {d.date} {d.time}</Text>
              {t.photo ? <Image source={{ uri: t.photo }} style={styles.photo} /> : null}
              {t.completionPhoto ? <Image source={{ uri: t.completionPhoto }} style={styles.photo} /> : null}
              <View style={styles.rowGap}><TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]} onPress={() => taskPdf(t)}><Text style={styles.actionText}>GERAR PDF</Text></TouchableOpacity><TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2E86AB' }]} onPress={() => Share.share({ message: `${APP_TITLE}\n${t.room}\n${t.description}` })}><Text style={styles.actionText}>COMPARTILHAR</Text></TouchableOpacity><TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} onPress={async () => { await deleteTask({ id: t.id }); refetch(); }}><Text style={styles.actionText}>EXCLUIR</Text></TouchableOpacity></View>
            </View>
          );
        })}
        {tasks.length === 0 ? <Text style={styles.empty}>Nenhuma tarefa concluída.</Text> : null}
        <BottomSpacer />
      </ScrollView>
    </ScreenContainer>
  );
}

function HistoricoOcorrenciasScreen() {
  const { data: items = [], loading, refetch } = useQuery('incidents', { status: 'completed' }, { column: 'completedAt', ascending: false });
  const { mutate: del } = useMutation('incidents', 'delete');

  const printOne = async (i) => {
    const img = await uriToEmbeddedImage(i.photo);
    const c = dateTimePt(i.createdAt); const d = dateTimePt(i.completedAt);
    await generatePdfAndShare(`<html><body style="font-family:Arial;padding:20px;"><h2>${APP_TITLE}</h2><h3>${SCHOOL_NAME}</h3><hr/><p><b>Tipo:</b> Ocorrência</p><p><b>Local:</b> ${i.room}</p><p><b>Encaminhamento:</b> ${i.forwardTo}</p><p><b>Descrição:</b> ${i.description}</p><p><b>Criação:</b> ${c.date} ${c.time}</p><p><b>Conclusão:</b> ${d.date} ${d.time}</p>${img ? `<img src="${img}" style="max-width:100%"/>` : ''}</body></html>`);
  };

  if (loading) return <ScreenContainer><Text style={styles.loadingText}>Carregando histórico...</Text></ScreenContainer>;

  return (
    <ScreenContainer>
      <View style={styles.header}><Text style={styles.screenTitle}>Histórico de Ocorrências</Text></View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {items.map((i) => {
          const c = dateTimePt(i.createdAt); const d = dateTimePt(i.completedAt);
          return (
            <View key={i.id} style={styles.card}>
              <Text style={styles.itemTitle}>{i.room}</Text>
              <Text style={styles.meta}>Encaminhamento: {i.forwardTo}</Text>
              <Text style={styles.itemText}>{i.description}</Text>
              <Text style={styles.meta}>Criação: {c.date} {c.time}</Text>
              <Text style={styles.meta}>Conclusão: {d.date} {d.time}</Text>
              {i.photo ? <Image source={{ uri: i.photo }} style={styles.photo} /> : null}
              <View style={styles.rowGap}><TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]} onPress={() => printOne(i)}><Text style={styles.actionText}>GERAR PDF</Text></TouchableOpacity><TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2E86AB' }]} onPress={() => Share.share({ message: `${APP_TITLE}\n${i.room}\n${i.description}` })}><Text style={styles.actionText}>COMPARTILHAR</Text></TouchableOpacity><TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} onPress={async () => { await del({ id: i.id }); refetch(); }}><Text style={styles.actionText}>EXCLUIR</Text></TouchableOpacity></View>
            </View>
          );
        })}
        {items.length === 0 ? <Text style={styles.empty}>Nenhuma ocorrência concluída.</Text> : null}
        <BottomSpacer />
      </ScrollView>
    </ScreenContainer>
  );
}

function Tabs() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { height: 70 + insets.bottom, paddingBottom: insets.bottom + 8, paddingTop: 8, backgroundColor: '#fff' },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: '#64748B',
      tabBarIcon: ({ color }) => {
        const icon = route.name === 'Tarefas' ? 'assignment' : route.name === 'Ocorrências' ? 'report' : route.name === 'Hist. Tarefas' ? 'history' : 'history-toggle-off';
        return <MaterialIcons name={icon} color={color} size={22} />;
      },
    })}>
      <Tab.Screen name="Tarefas" component={TarefasScreen} />
      <Tab.Screen name="Ocorrências" component={OcorrenciasScreen} />
      <Tab.Screen name="Hist. Tarefas" component={HistoricoTarefasScreen} />
      <Tab.Screen name="Hist. Ocorrências" component={HistoricoOcorrenciasScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <View style={{ flex: 1 }}>
          <StatusBar barStyle="dark-content" />
          <NavigationContainer>
            <Tabs />
          </NavigationContainer>
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  headerButton: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  headerButtonText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 12 },
  itemTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  itemText: { fontSize: 16, color: '#334155', marginBottom: 8, lineHeight: 22 },
  meta: { color: '#64748b', marginBottom: 6, fontSize: 13 },
  badge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 8 },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  photo: { width: '100%', height: 180, borderRadius: 10, marginBottom: 8 },
  rowGap: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  actionBtn: { flex: 1, borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  smallAction: { minWidth: '48%', borderRadius: 10, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 20, fontSize: 16 },
  loadingText: { textAlign: 'center', marginTop: 40, color: '#334155', fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalBody: { backgroundColor: '#fff', margin: 14, borderRadius: 16, padding: 14, maxHeight: '92%' },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 10, color: '#0f172a' },
  label: { color: '#0f172a', fontWeight: '700', marginBottom: 6, marginTop: 8, fontSize: 15 },
  pickerWrap: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, overflow: 'hidden' },
  inputGroup: { marginTop: 8 },
  textArea: { borderWidth: 1, borderRadius: 10, minHeight: 96, padding: 10, textAlignVertical: 'top', fontSize: 15 },
  secondaryButton: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 8 },
  bigButton: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  bigButtonText: { color: '#fff', fontWeight: '800', marginLeft: 6 },
  priorityBtn: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  preview: { width: 120, height: 120, borderRadius: 10, marginTop: 8 },
  cancel: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', paddingVertical: 12 },
  save: { flex: 1, borderRadius: 10, backgroundColor: '#2E86AB', alignItems: 'center', paddingVertical: 12 },
});
