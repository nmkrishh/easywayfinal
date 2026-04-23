import React from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <Text style={styles.title}>EasyWay Mobile</Text>
        <Text style={styles.subtitle}>GitHub Actions + EAS is configured.</Text>
        <Text style={styles.subtitle}>Replace this app with your generated React Native code.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0b0b0c",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  title: {
    color: "#f2f2f2",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#a1a1aa",
    fontSize: 14,
    textAlign: "center",
  },
});