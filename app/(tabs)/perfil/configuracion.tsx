import { ScrollView } from 'react-native';
import { usePermissions } from '@/hooks/usePermissions';
import { PerfilConfiguracionTab } from '@/components/Perfil';

export default function ConfiguracionScreen() {
  const { isAdmin } = usePermissions();

  if (!isAdmin()) {
    return <ScrollView style={{ flex: 1 }} />;
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 }}>
      <PerfilConfiguracionTab />
    </ScrollView>
  );
}
