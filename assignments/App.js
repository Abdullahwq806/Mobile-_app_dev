import React, { useState } from 'react';
import { View, Text, TextInput, SectionList, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const contactsData = [
  { name: 'Ahmed Khan', number: '03001234567', group: 'Family' },
  { name: 'Sara Malik', number: '03012345678', group: 'Friends' },
  { name: 'Usman Ali', number: '03111234567', group: 'Office' },
  { name: 'Fatima Zahra', number: '03331234567', group: 'Family' },
  { name: 'Bilal Ahmad', number: '03451234567', group: 'Friends' },
  { name: 'Zainab Bibi', number: '03021234567', group: 'Office' },
  { name: 'Hassan Raza', number: '03121234567', group: 'Family' },
  { name: 'Areeba Khan', number: '03311234567', group: 'Friends' },
  { name: 'Ali Raza', number: '03411234567', group: 'Office' },
  { name: 'Mariam Shah', number: '03041234567', group: 'Friends' },
];

const groupContacts = (contacts) => {
  const groups = ['Family', 'Friends', 'Office'];
  return groups.map(group => ({
    title: group,
    data: contacts.filter(contact => contact.group === group)
  })).filter(section => section.data.length > 0);
};

export default function App() {
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  const filtered = contactsData.filter(contact =>
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.number.includes(search)
  );

  const groupedContacts = groupContacts(filtered);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Contacts Manager 🇵🇰</Text>
      <TextInput
        style={styles.input}
        placeholder="Search by name or number"
        value={search}
        onChangeText={setSearch}
      />
      <SectionList
        sections={groupedContacts}
        keyExtractor={(item, index) => item.name + index}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedContact(item)}>
            <Text style={styles.contactItem}>{item.name} - {item.number}</Text>
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
      />
      <Modal visible={!!selectedContact} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contact Details</Text>
            {selectedContact && (
              <>
                <Text>Name: {selectedContact.name}</Text>
                <Text>Number: {selectedContact.number}</Text>
                <Text>Group: {selectedContact.group}</Text>
              </>
            )}
            <TouchableOpacity onPress={() => setSelectedContact(null)} style={styles.closeBtn}>
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 50, flex: 1, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 15 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', backgroundColor: '#eee', paddingVertical: 5, paddingHorizontal: 10 },
  contactItem: { padding: 10, fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, margin: 30 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  closeBtn: { backgroundColor: '#28a745', padding: 10, borderRadius: 5, marginTop: 15, alignItems: 'center' }
});
