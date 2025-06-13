import React, { useState, useEffect, createContext, useContext, useReducer, useCallback } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView,
  Platform,
  Animated
} from "react-native";

const Gyroscope = {
  addListener: (callback) => {
    let id = setInterval(() => {
      callback({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        z: (Math.random() - 0.5) * 4,
      });
    }, 200);
    return { remove: () => clearInterval(id) };
  },
  requestPermissionsAsync: async () => ({ status: "granted" }),
};

const RecipeContext = createContext();

const recipeReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: true, error: null };
    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.payload, loading: false, error: null };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "ADD_FAVORITE":
      if (state.favorites.find(fav => fav.idMeal === action.payload.idMeal)) {
        Alert.alert("Duplicate", "This recipe is already in your favorites list.");
        return state;
      }
      return { ...state, favorites: [{ ...action.payload, note: "" }, ...state.favorites] };
    case "REMOVE_FAVORITE":
      return { ...state, favorites: state.favorites.filter(fav => fav.idMeal !== action.payload.idMeal) };
    case "UPDATE_NOTE":
      return {
        ...state,
        favorites: state.favorites.map(fav =>
          fav.idMeal === action.payload.mealId ? { ...fav, note: action.payload.note } : fav
        ),
      };
    default:
      return state;
  }
};

const RecipeProvider = ({ children }) => {
  const initialState = {
    searchResults: [],
    favorites: [],
    loading: false,
    error: null,
  };

  const [state, dispatch] = useReducer(recipeReducer, initialState);

  const searchByIngredient = useCallback(async (ingredient) => {
    if (!ingredient) {
      dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
      return;
    }
    dispatch({ type: "SET_LOADING" });
    try {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
      const data = await response.json();
      if (data.meals) {
        dispatch({ type: "SET_SEARCH_RESULTS", payload: data.meals });
      } else {
        dispatch({ type: "SET_ERROR", payload: "No recipes found for this ingredient." });
        dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Could not fetch recipes." });
    }
  }, []);

  const addFavorite = (meal) => dispatch({ type: "ADD_FAVORITE", payload: meal });
  const removeFavorite = (meal) => dispatch({ type: "REMOVE_FAVORITE", payload: meal });
  const updateNote = (mealId, note) => dispatch({ type: "UPDATE_NOTE", payload: { mealId, note } });

  return (
    <RecipeContext.Provider value={{ state, searchByIngredient, addFavorite, removeFavorite, updateNote }}>
      {children}
    </RecipeContext.Provider>
  );
};

const RecipeScreen = () => {
  const { state, searchByIngredient, addFavorite } = useContext(RecipeContext);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    searchByIngredient("Chicken");
  }, [searchByIngredient]);

  const handleSubmit = () => {
    searchByIngredient(searchTerm.trim() || "Chicken");
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.input}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="e.g., Salmon, Beef..."
            placeholderTextColor="#aaa"
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSubmit}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <View style={{ flex: 1 }}>
        {state.loading && (
          <Text style={styles.loadingText}>Loading...</Text>
        )}
        {!state.loading && state.searchResults && (
          <FlatList
            data={state.searchResults}
            keyExtractor={item => item.idMeal}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            contentContainerStyle={{ padding: 6 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Image
                  source={{ uri: item.strMealThumb }}
                  style={styles.cardImg}
                  resizeMode="cover"
                />
                <Text style={styles.cardTitle} numberOfLines={2}>{item.strMeal}</Text>
                <TouchableOpacity
                  style={styles.favBtn}
                  onPress={() => addFavorite(item)}>
                  <Text style={styles.favBtnText}>Add Favorite</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{state.error || "No recipes found."}</Text>
            }
          />
        )}
      </View>
    </View>
  );
};

const FavoritesScreen = () => {
  const { state, removeFavorite, updateNote } = useContext(RecipeContext);
  const [editingNote, setEditingNote] = useState({ id: null, text: "" });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 8 }}>
      {state.favorites.length === 0 ? (
        <Text style={styles.emptyText}>Your favorites list is empty.</Text>
      ) : (
        state.favorites.map(item => {
          const isEditing = editingNote.id === item.idMeal;
          return (
            <View key={item.idMeal} style={styles.favCard}>
              <Image source={{ uri: item.strMealThumb }} style={styles.favImg} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.favTitle} numberOfLines={1}>{item.strMeal}</Text>
                {isEditing ? (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <TextInput
                      value={editingNote.text}
                      onChangeText={text => setEditingNote({ ...editingNote, text })}
                      style={styles.noteInput}
                      placeholder="Add a note..."
                      placeholderTextColor="#aaa"
                    />
                    <TouchableOpacity
                      style={styles.noteSaveBtn}
                      onPress={() => {
                        updateNote(item.idMeal, editingNote.text);
                        setEditingNote({ id: null, text: "" });
                      }}>
                      <Text style={styles.noteBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.favNote} numberOfLines={1}>{item.note ? "${item.note}" : "No note added."}</Text>
                    <TouchableOpacity
                      onPress={() => setEditingNote({ id: item.idMeal, text: item.note || "" })}
                      style={{ marginTop: 2 }}>
                      <Text style={styles.noteActionBtn}>{item.note ? "Edit Note" : "Add Note"}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeFavorite(item)}>
                <Text style={{ fontSize: 22, color: "#ff5252" }}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const SensorScreen = () => {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [ball] = useState(new Animated.ValueXY({ x: 0, y: 0 }));

  useEffect(() => {
    let subscription;
    Gyroscope.requestPermissionsAsync().then(({ status }) => {
      if (status === "granted") {
        subscription = Gyroscope.addListener(setData);
      }
    });
    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  useEffect(() => {
    Animated.spring(ball, {
      toValue: { x: data.x * -20, y: data.y * 20 },
      useNativeDriver: true,
      speed: 10,
      bounciness: 8,
    }).start();
  }, [data.x, data.y]);

  return (
    <View style={styles.sensorScreen}>
      <Text style={styles.sensorTitle}>Kitchen Spirit Level</Text>
      <View style={styles.levelWrapper}>
        <Animated.View
          style={[
            styles.levelBall,
            {
              transform: [
                { translateX: ball.x },
                { translateY: ball.y }
              ]
            }
          ]}
        />
      </View>
      <View style={styles.sensorDataBox}>
        <Text style={styles.sensorData}>x: {data.x.toFixed(2)}</Text>
        <Text style={styles.sensorData}>y: {data.y.toFixed(2)}</Text>
        <Text style={styles.sensorData}>z: {data.z.toFixed(2)}</Text>
      </View>
      <Text style={styles.sensorHint}>Displaying simulated sensor data</Text>
    </View>
  );
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState("Search");
  const screens = [
    { key: "Search", label: "Search" },
    { key: "Favorites", label: "Favorites" },
    { key: "Sensor", label: "Sensor" }
  ];

  const renderScreen = () => {
    if (activeScreen === "Search") return <RecipeScreen />;
    if (activeScreen === "Favorites") return <FavoritesScreen />;
    if (activeScreen === "Sensor") return <SensorScreen />;
    return <RecipeScreen />;
  };

  return (
    <RecipeProvider>
      <View style={styles.appContainer}>
        <View style={styles.header}>
          {screens.map(screen => (
            <TouchableOpacity
              key={screen.key}
              onPress={() => setActiveScreen(screen.key)}
              style={[
                styles.tabBtn,
                activeScreen === screen.key && styles.tabBtnActive
              ]}
            >
              <Text style={[
                styles.tabBtnText,
                activeScreen === screen.key && styles.tabBtnTextActive
              ]}>
                {screen.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          {renderScreen()}
        </View>
      </View>
    </RecipeProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#f3f2fa",
    paddingTop: Platform.OS === "android" ? 35 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    elevation: 2,
  },
  tabBtn: {
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: "transparent",
  },
  tabBtnActive: {
    backgroundColor: "#7c3aed",
  },
  tabBtnText: {
    fontSize: 15,
    color: "#777",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  tabBtnTextActive: {
    color: "#fff",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f3f2fa",
  },
  searchBox: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#f1ebff",
    alignItems: "center",
    marginBottom: 2,
    elevation: 2,
    zIndex: 2,
  },
  input: {
    flex: 1,
    backgroundColor: "#f3f2fa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0d9fa",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    fontSize: 16,
    color: "#444",
  },
  searchBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  searchBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 40,
    color: "#9b94c9",
    fontSize: 18,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    margin: 6,
    elevation: 3,
    alignItems: "center",
    paddingBottom: 9,
    overflow: "hidden",
    shadowColor: "#8c6be8",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImg: {
    width: "100%",
    height: 100,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cardTitle: {
    paddingVertical: 8,
    paddingHorizontal: 7,
    fontSize: 15,
    fontWeight: "700",
    color: "#40336d",
    textAlign: "center",
  },
  favBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 8,
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: "center",
    marginBottom: 4,
  },
  favBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  emptyText: {
    color: "#bbb",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    fontStyle: "italic",
  },
  favCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#7c3aed",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  favImg: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#eceaf6",
  },
  favTitle: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#423075",
    marginBottom: 2,
  },
  favNote: {
    fontSize: 13,
    color: "#7a7a7a",
    fontStyle: "italic",
    marginTop: 1,
  },
  noteInput: {
    flex: 1,
    backgroundColor: "#f3f2fa",
    borderWidth: 1,
    borderColor: "#e0d9fa",
    borderRadius: 7,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    color: "#444",
  },
  noteSaveBtn: {
    marginLeft: 7,
    backgroundColor: "#2563eb",
    borderRadius: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  noteBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  noteActionBtn: {
    color: "#7c3aed",
    fontWeight: "bold",
    fontSize: 13,
    marginTop: 2,
  },
  removeBtn: {
    marginLeft: 10,
    padding: 6,
    alignSelf: "flex-start",
  },
  sensorScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f2fa",
    padding: 20,
  },
  sensorTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#7c3aed",
    marginBottom: 22,
  },
  levelWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: "#e0d9fa",
    backgroundColor: "#e4e2f7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: "#8c6be8",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  levelBall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7c3aed",
    shadowColor: "#7c3aed",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  sensorDataBox: {
    backgroundColor: "#40336d",
    borderRadius: 12,
    padding: 18,
    marginTop: 10,
    width: 170,
    alignItems: "center",
  },
  sensorData: {
    color: "#fff",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 16,
    marginVertical: 1,
    textAlign: "center",
  },
  sensorHint: {
    marginTop: 23,
    fontSize: 13,
    color: "#9b94c9",
    textAlign: "center",
  },
});