import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
import { useMutation, useQuery } from './src/platform-hooks';

const primaryColor = '#2E86AB';
const accentColor = '#FF6B35';
const backgroundColor = '#F8FAFC';
const cardColor = '#FFFFFF';
const textPrimary = '#1F2937';
const textSecondary = '#6B7280';

const priorityColors = {
  Vermelho: '#EF4444',
  Amarelo: '#F59E0B',
  Verde: '#10B981',
  Azul: '#3B82F6',
};

const priorityValues = {
  Vermelho: 1,
  Amarelo: 2,
  Verde: 3,
  Azul: 4,
};

const Tab = createBottomTabNavigator();
const ThemeContext = React.createContext();

function ThemeProvider({ children }) {
  const [darkMode] = useState(false);

  const lightTheme = useMemo(
    () => ({
      colors: {
        primary: primaryColor,
        accent: accentColor,
        background: backgroundColor,
        card: cardColor,
        textPrimary,
        textSecondary,
        border: '#E5E7EB',
        success: '#10B981',
      },
    }),
    []
  );

  const theme = darkMode ? lightTheme : lightTheme;
  const value = useMemo(() => ({ theme, darkMode }), [theme, darkMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const useTheme = () => useContext(ThemeContext);

function useHomeScreenState() {
  const { theme } = useTheme();
  const { data: tasks, loading, refetch } = useQuery('tasks', { status: 'Pendente' }, { column: 'created_at', ascending: false });
  const { mutate: insertTask } = useMutation('tasks', 'insert');
  const { mutate: updateTask } = useMutation('tasks', 'update');

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    description: '',
    priority: 'Vermelho',
  });

  const sortedTasks = useMemo(() => {
    if (!tasks) return [];
    return [...tasks].sort((a, b) => priorityValues[a.priority] - priorityValues[b.priority]);
  }, [tasks]);

  return { theme, tasks: sortedTasks, loading, refetch, insertTask, updateTask, showAddModal, setShowAddModal, formData, setFormData };
}

const homeHandlers = {
  openAddModal(state) {
    state.setFormData({ location: '', description: '', priority: 'Vermelho' });
    state.setShowAddModal(true);
  },
  closeAddModal(state) {
    state.setShowAddModal(false);
  },
  updateFormData(state, field, value) {
    state.setFormData((prev) => ({ ...prev, [field]: value }));
  },
  async addTask(state) {
    if (!state.formData.location.trim() || !state.formData.description.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    await state.insertTask({
      location: state.formData.location.trim(),
      description: state.formData.description.trim(),
      priority: state.formData.priority,
      status: 'Pendente',
      created_at: new Date().toISOString(),
      completed_at: null,
    });

    await state.refetch();
    state.setShowAddModal(false);
    state.setFormData({ location: '', description: '', priority: 'Vermelho' });
    Alert.alert('Sucesso', 'Tarefa adicionada com sucesso!');
  },
  completeTask(state, taskId) {
    Alert.alert('Confirmar', 'Confirma a conclusão desta tarefa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          await state.updateTask({ id: taskId, data: { status: 'Concluído', completed_at: new Date().toISOString() } });
          await state.refetch();
          Alert.alert('Sucesso', 'Tarefa concluída!');
        },
      },
    ]);
  },
};

function AddTaskModal({ state, handlers }) {
  const currentDate = new Date();

  return (
    <Modal visible={state.showAddModal} animationType="slide" transparent onRequestClose={() => handlers.closeAddModal(state)}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBody, { backgroundColor: state.theme.colors.card }]}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: state.theme.colors.textPrimary }]}>Nova Tarefa</Text>
                <TouchableOpacity onPress={() => handlers.closeAddModal(state)}>
                  <MaterialIcons name="close" size={24} color={state.theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: state.theme.colors.textPrimary }]}>Local *</Text>
              <View style={[styles.input, { borderColor: state.theme.colors.border }]}>
                <Picker selectedValue={state.formData.location} onValueChange={(value) => handlers.updateFormData(state, 'location', value)}>
                  <Picker.Item label="Selecione um local..." value="" />
                  <Picker.Item label="1ºA - Carol Ishida" value="1ºA - Carol Ishida" />
                  <Picker.Item label="1ºB - Renata" value="1ºB - Renata" />
                  <Picker.Item label="2ºA - Juliana" value="2ºA - Juliana" />
                  <Picker.Item label="2ºB - Cristiane" value="2ºB - Cristiane" />
                  <Picker.Item label="3ºA - Kamila" value="3ºA - Kamila" />
                  <Picker.Item label="3ºB - Márcia" value="3ºB - Márcia" />
                  <Picker.Item label="4ºA - Susimar" value="4ºA - Susimar" />
                  <Picker.Item label="4ºB - Sonia" value="4ºB - Sonia" />
                  <Picker.Item label="5ºA - Flávia" value="5ºA - Flávia" />
                  <Picker.Item label="5ºB - Carol Muzy" value="5ºB - Carol Muzy" />
                  <Picker.Item label="Educação Física - Tiago" value="Educação Física - Tiago" />
                </Picker>
              </View>

              <Text style={[styles.label, { color: state.theme.colors.textPrimary }]}>Descrição *</Text>
              <TextInput
                style={[styles.textArea, { borderColor: state.theme.colors.border, color: state.theme.colors.textPrimary }]}
                placeholder="Descreva o problema..."
                value={state.formData.description}
                onChangeText={(text) => handlers.updateFormData(state, 'description', text)}
                multiline
              />

              <Text style={[styles.label, { color: state.theme.colors.textPrimary }]}>Prioridade</Text>
              {['Vermelho', 'Amarelo', 'Verde', 'Azul'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    {
                      backgroundColor: state.formData.priority === priority ? priorityColors[priority] : state.theme.colors.background,
                      borderColor: priorityColors[priority],
                    },
                  ]}
                  onPress={() => handlers.updateFormData(state, 'priority', priority)}
                >
                  <Text style={{ color: state.formData.priority === priority ? '#fff' : state.theme.colors.textPrimary }}>{priority}</Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.dateInfo, { color: state.theme.colors.textSecondary }]}>Data: {currentDate.toLocaleString('pt-BR')}</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => handlers.closeAddModal(state)}>
                  <Text>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: state.theme.colors.primary }]} onPress={() => handlers.addTask(state)}>
                  <Text style={{ color: '#fff' }}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function HomeScreen() {
  const state = useHomeScreenState();

  if (state.loading) {
    return (
      <View style={[styles.center, { backgroundColor: state.theme.colors.background }]}>
        <Text>Carregando tarefas...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: state.theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: state.theme.colors.textPrimary }]}>Tarefas Pendentes</Text>
        <Text style={{ color: state.theme.colors.textSecondary }}>{state.tasks.length} tarefa(s)</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {state.tasks.length === 0 ? (
          <View style={styles.center}>
            <MaterialIcons name="assignment" size={64} color={state.theme.colors.textSecondary} />
            <Text>Nenhuma tarefa pendente</Text>
          </View>
        ) : (
          state.tasks.map((task) => (
            <View key={task.id} style={[styles.taskCard, { borderLeftColor: priorityColors[task.priority] }]}>
              <View style={styles.rowBetween}>
                <Text>{task.priority}</Text>
                <TouchableOpacity style={styles.completeButton} onPress={() => homeHandlers.completeTask(state, task.id)}>
                  <MaterialIcons name="check" color="#fff" size={20} />
                </TouchableOpacity>
              </View>
              <Text style={styles.taskLocation}>{task.location}</Text>
              <Text style={styles.taskDescription}>{task.description}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: state.theme.colors.accent }]} onPress={() => homeHandlers.openAddModal(state)}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddTaskModal state={state} handlers={homeHandlers} />
    </View>
  );
}

function HistoryScreen() {
  const { theme } = useTheme();
  const { data: completedTasks, loading } = useQuery('tasks', { status: 'Concluído' }, { column: 'completed_at', ascending: false });

  if (loading) return <View style={styles.center}><Text>Carregando histórico...</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.colors.textPrimary }]}>Histórico</Text>
        <Text style={{ color: theme.colors.textSecondary }}>{completedTasks.length} concluída(s)</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {completedTasks.map((task) => (
          <View key={task.id} style={[styles.taskCard, { borderLeftColor: priorityColors[task.priority] }]}>
            <Text style={styles.taskLocation}>{task.location}</Text>
            <Text style={styles.taskDescription}>{task.description}</Text>
            <Text style={{ color: theme.colors.textSecondary }}>
              Concluída em {new Date(task.completed_at).toLocaleString('pt-BR')}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 70, paddingBottom: 8, backgroundColor: theme.colors.card },
        tabBarActiveTintColor: theme.colors.primary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Tarefas', tabBarIcon: ({ color }) => <MaterialIcons name="assignment" size={22} color={color} /> }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Histórico', tabBarIcon: ({ color }) => <MaterialIcons name="history" size={22} color={color} /> }}
      />
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
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  screenTitle: { fontSize: 24, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskLocation: { fontSize: 18, fontWeight: '700', marginVertical: 6 },
  taskDescription: { fontSize: 16, marginBottom: 8 },
  completeButton: { backgroundColor: '#10B981', borderRadius: 18, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBody: { margin: 16, borderRadius: 16, padding: 18, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 15, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10 },
  textArea: { borderWidth: 1, borderRadius: 10, minHeight: 100, padding: 12, textAlignVertical: 'top' },
  priorityButton: { borderWidth: 2, borderRadius: 10, padding: 10, marginBottom: 8, alignItems: 'center' },
  dateInfo: { marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  button: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelButton: { borderWidth: 1, borderColor: '#d1d5db' },
});
