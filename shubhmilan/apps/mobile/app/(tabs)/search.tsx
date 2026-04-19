import { EmptyState, colors } from '@shubhmilan/ui';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Search() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
      <EmptyState
        title="Advanced search"
        description="Filter by religion, caste, city, education, diet and more. Coming next from the prototype spec."
      />
    </SafeAreaView>
  );
}
