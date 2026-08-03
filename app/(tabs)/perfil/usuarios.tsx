import { ScrollView } from 'react-native';
import { usePermissions } from '@/hooks/usePermissions';
import { PerfilUsuariosTab } from '@/components/Perfil';

export default function UsuariosScreen() {
  const { isAdmin } = usePermissions();

  if (!isAdmin()) {
    return <ScrollView style={{ flex: 1 }} />;
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 }}>
      <PerfilUsuariosTab />
    </ScrollView>
  );
}
