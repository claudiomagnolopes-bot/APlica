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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useMutation, useQuery } from './src/platform-hooks';

const primaryColor = '#2E86AB';
const accentColor = '#F39801';
const backgroundColor = '#F8FAFC';
const cardColor = '#FFFFFF';
const textPrimary = '#1E293B';
const textSecondary = '#64748B';
const ROOMS_LIST = [
  '1ºA - Carol Ishida', '1ºB - Renata', '2ºA - Juliana', '2ºB - Cristiane', '3ºA - Kamila', '3ºB - Márcia',
  '4ºA - Susimar', '4ºB - Sonia', '5ºA - Flávia', '5ºB - Carol Muzy', 'Cozinha', 'Coordenação', 'Direção',
  'Vice Direção', 'Secretaria', 'Limpeza', 'Educação Física', 'A.D.E - Leny, Elizangêla',
];

const priorityColors = { high: '#EF4444', medium: '#F59E0B', low: '#10B981', veryLow: '#3B82F6' };
const priorityLabel = { high: 'Alta', medium: 'Média', low: 'Baixa', veryLow: 'Muito Baixa' };

const Tab = createBottomTabNavigator();
const ThemeContext = React.createContext();

function ThemeProvider({ children }) {
  const [darkMode] = useState(false);
  const lightTheme = useMemo(() => ({
    colors: {
      primary: primaryColor,
      accent: accentColor,
      background: backgroundColor,
      card: cardColor,
      textPrimary,
      textSecondary,
      border: '#E2E8F0',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
    },
  }), []);

  return <ThemeContext.Provider value={{ theme: lightTheme, darkMode }}>{children}</ThemeContext.Provider>;
}

const useTheme = () => useContext(ThemeContext);

function HomeScreen() {
  const { theme } = useTheme();
  const { data: tasks, loading, refetch } = useQuery('tasks', { status: 'Pendente' }, { column: 'created_at', ascending: false });
  const { mutate: insertTask } = useMutation('tasks', 'insert');
  const { mutate: updateTask } = useMutation('tasks', 'update');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ location: '', description: '', priority: 'high' });

  const sortedTasks = useMemo(() => [...(tasks || [])].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2, veryLow: 3 };
    return order[a.priority] - order[b.priority];
  }), [tasks]);

  const addTask = async () => {
    if (!formData.location || !formData.description.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }
    await insertTask({ ...formData, status: 'Pendente', created_at: new Date().toISOString(), completed_at: null });
    await refetch();
    setFormData({ location: '', description: '', priority: 'high' });
    setShowAddModal(false);
  };

  const completeTask = (taskId) => {
    Alert.alert('Confirmar', 'Concluir tarefa?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Concluir', onPress: async () => {
        await updateTask({ id: taskId, data: { status: 'Concluído', completed_at: new Date().toISOString() } });
        await refetch();
      } },
    ]);
  };

  if (loading) return <View style={styles.center}><Text>Carregando tarefas...</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.colors.textPrimary }]}>Tarefas</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={() => setShowAddModal(true)}>
          <MaterialIcons name="add" size={20} color="#fff" /><Text style={styles.addButtonText}>Nova</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {sortedTasks.length === 0 ? <Text style={{ color: theme.colors.textSecondary }}>Nenhuma tarefa ativa</Text> : sortedTasks.map((task) => (
          <View key={task.id} style={[styles.card, { borderColor: theme.colors.border, borderLeftColor: priorityColors[task.priority], borderLeftWidth: 4 }]}>
            <Text style={styles.title}>{task.location}</Text>
            <Text style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>{task.description}</Text>
            <View style={styles.rowBetween}>
              <Text style={{ color: priorityColors[task.priority], fontWeight: '700' }}>{priorityLabel[task.priority]}</Text>
              <TouchableOpacity style={[styles.completeButton, { backgroundColor: theme.colors.success }]} onPress={() => completeTask(task.id)}>
                <MaterialIcons name="check" color="#fff" size={18} />
                <Text style={{ color: '#fff', marginLeft: 5 }}>Concluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalBody, { backgroundColor: theme.colors.card }]}>
            <Text style={styles.modalTitle}>Nova Tarefa</Text>
            <Text style={styles.label}>Local *</Text>
            <View style={styles.input}><Picker selectedValue={formData.location} onValueChange={(value) => setFormData((p) => ({ ...p, location: value }))}>
              <Picker.Item label="Selecione..." value="" />
              {ROOMS_LIST.map((room) => <Picker.Item key={room} label={room} value={room} />)}
            </Picker></View>
            <Text style={styles.label}>Descrição *</Text>
            <TextInput style={styles.textArea} value={formData.description} onChangeText={(description) => setFormData((p) => ({ ...p, description }))} multiline />
            <Text style={styles.label}>Prioridade</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {Object.keys(priorityLabel).map((k) => (
                <TouchableOpacity key={k} style={[styles.pill, { borderColor: priorityColors[k], backgroundColor: formData.priority === k ? priorityColors[k] : '#fff' }]} onPress={() => setFormData((p) => ({ ...p, priority: k }))}>
                  <Text style={{ color: formData.priority === k ? '#fff' : priorityColors[k] }}>{priorityLabel[k]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setShowAddModal(false)}><Text>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={addTask}><Text style={{ color: '#fff' }}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function IncidentsScreen() {
  const { theme } = useTheme();
  const { data: incidents, loading, refetch } = useQuery('incidents', {}, { column: 'createdAt', ascending: false });
  const { mutate: insertIncident } = useMutation('incidents', 'insert');
  const { mutate: deleteIncident } = useMutation('incidents', 'delete');

  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedForward, setSelectedForward] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setSelectedRoom('');
    setSelectedForward('');
    setDescription('');
  };

  const saveIncident = async () => {
    if (!selectedRoom || !selectedForward || !description.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }
    await insertIncident({ room: selectedRoom, forwardTo: selectedForward, description: description.trim(), createdAt: new Date().toISOString() });
    await refetch();
    resetForm();
    setShowModal(false);
  };

  const createIncidentPdf = async (incident) => {
    const created = new Date(incident.createdAt);
    const html = `
      <html><body style="font-family:Arial;padding:24px;">
      <h1 style="color:#2E86AB;">Ocorrência Escolar</h1>
      <hr/>
      <p><strong>Sala/Local:</strong> ${incident.room}</p>
      <p><strong>Encaminhado para:</strong> ${incident.forwardTo}</p>
      <p><strong>Descrição:</strong><br/>${incident.description}</p>
      <p><strong>Data:</strong> ${created.toLocaleDateString('pt-BR')}</p>
      <p><strong>Hora:</strong> ${created.toLocaleTimeString('pt-BR')}</p>
      </body></html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  };

  const handleGenerateAndSharePdf = async (incident) => {
    try {
      const pdfUri = await createIncidentPdf(incident);
      if (Platform.OS === 'web') {
        Alert.alert('PDF gerado', 'No navegador, use o download da janela de impressão.');
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(pdfUri, { mimeType: 'application/pdf', dialogTitle: 'Enviar ocorrência em PDF' });
      } else {
        await Share.share({ message: `PDF salvo em: ${pdfUri}` });
      }
    } catch (error) {
      Alert.alert('Erro', `Não foi possível gerar/enviar o PDF: ${error.message}`);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Excluir', 'Deseja excluir esta ocorrência?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        await deleteIncident({ id });
        await refetch();
      } },
    ]);
  };

  if (loading) return <View style={styles.center}><Text>Carregando ocorrências...</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.colors.textPrimary }]}>Ocorrências</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.accent }]} onPress={() => setShowModal(true)}>
          <MaterialIcons name="add" size={20} color="#fff" /><Text style={styles.addButtonText}>Nova</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {(incidents || []).length === 0 ? <Text style={{ color: theme.colors.textSecondary }}>Nenhuma ocorrência registrada</Text> : incidents.map((incident) => (
          <View key={incident.id} style={[styles.card, { borderColor: theme.colors.border }]}>
            <Text style={styles.title}>{incident.room}</Text>
            <Text style={{ color: theme.colors.textSecondary, marginBottom: 6 }}>{incident.description}</Text>
            <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>Encaminhado para: {incident.forwardTo}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.warning }]} onPress={() => handleGenerateAndSharePdf(incident)}>
                <MaterialIcons name="picture-as-pdf" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>PDF / Enviar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.error }]} onPress={() => handleDelete(incident.id)}>
                <MaterialIcons name="delete" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalBody, { backgroundColor: theme.colors.card }]}>
            <Text style={styles.modalTitle}>Nova Ocorrência</Text>
            <Text style={styles.label}>Sala/Local *</Text>
            <View style={styles.input}><Picker selectedValue={selectedRoom} onValueChange={setSelectedRoom}>
              <Picker.Item label="Selecione..." value="" />
              {ROOMS_LIST.map((room) => <Picker.Item key={room} label={room} value={room} />)}
            </Picker></View>
            <Text style={styles.label}>Encaminhar para *</Text>
            <View style={styles.input}><Picker selectedValue={selectedForward} onValueChange={setSelectedForward}>
              <Picker.Item label="Selecione..." value="" />
              {['Direção', 'Vice-direção', 'Coordenação', 'Secretaria', 'Cozinha'].map((target) => <Picker.Item key={target} label={target} value={target} />)}
            </Picker></View>
            <Text style={styles.label}>Descrição *</Text>
            <TextInput style={styles.textArea} value={description} onChangeText={setDescription} multiline placeholder="Descreva a ocorrência" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setShowModal(false)}><Text>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.accent }]} onPress={saveIncident}><Text style={{ color: '#fff' }}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function HistoryScreen() {
  const { theme } = useTheme();
  const { data: completedTasks, loading } = useQuery('tasks', { status: 'Concluído' }, { column: 'completed_at', ascending: false });
  if (loading) return <View style={styles.center}><Text>Carregando histórico...</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}><Text style={[styles.screenTitle, { color: theme.colors.textPrimary }]}>Histórico</Text></View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {(completedTasks || []).map((task) => (
          <View key={task.id} style={[styles.card, { borderColor: theme.colors.border, borderLeftColor: priorityColors[task.priority], borderLeftWidth: 4 }]}>
            <Text style={styles.title}>{task.location}</Text>
            <Text>{task.description}</Text>
            <Text style={{ color: theme.colors.textSecondary }}>Concluída em {new Date(task.completed_at).toLocaleString('pt-BR')}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function TabNavigator() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarStyle: { height: 72, paddingBottom: 8, backgroundColor: theme.colors.card },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
    }}>
      <Tab.Screen name="Tarefas" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="assignment" size={22} color={color} /> }} />
      <Tab.Screen name="Ocorrências" component={IncidentsScreen} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="report" size={22} color={color} /> }} />
      <Tab.Screen name="Histórico" component={HistoryScreen} options={{ tabBarIcon: ({ color }) => <MaterialIcons name="history" size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  screenTitle: { fontSize: 24, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  addButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '700', marginLeft: 5 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completeButton: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBody: { margin: 16, borderRadius: 16, padding: 16, maxHeight: '92%' },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  label: { fontSize: 15, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, overflow: 'hidden' },
  textArea: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, minHeight: 100, padding: 12, textAlignVertical: 'top' },
  pill: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  button: { flex: 1, borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  cancelButton: { borderWidth: 1, borderColor: '#d1d5db' },
  actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 },
});
