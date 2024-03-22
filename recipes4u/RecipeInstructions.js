import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from './firebaseconfig'; // Ensure this points to your Firebase configuration

const RecipeInstructionsScreen = ({ route }) => {
    const navigation = useNavigation();
    const { instructions, label, image, ingredients } = route.params;
    const db = getFirestore();

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [fadeAnims, setFadeAnims] = useState(instructions.map(() => new Animated.Value(0)));

    useEffect(() => {
        if (fadeAnims.length > 0) {
            Animated.timing(fadeAnims[currentStepIndex], {
                toValue: 1,
                duration: 650,
                useNativeDriver: true,
            }).start();
        }
    }, [currentStepIndex, fadeAnims.length]);

    const logCookInteraction = async () => {
        if (auth.currentUser) {
            await addDoc(collection(db, 'interactions'), {
                user_id: auth.currentUser.uid,
                recipe_id: label,
                recipe_image: image,
                interaction_type: 'cook',
                timestamp: serverTimestamp(),
            });

            sendCookInteractionToBackend(label);
        }
    };

    const sendCookInteractionToBackend = async (recipeLabel) => {
        fetch('http://your.network.ip.address:3005/api/recipes/interact', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                label: recipeLabel,
                type: 'cook',
                action: 'add',
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to send cook interaction to backend');
            }
            return response.json();
        })
        .then(data => console.log(data))
        .catch(error => console.error('Error sending cook interaction to backend:', error));
    };

    const handleNextStep = () => {
        if (currentStepIndex < instructions.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            // Show confirmation dialog
            Alert.alert(
                'Finish Cooking', // Alert Title
                'Please proceed only if you have actually cooked this recipe for a more personalized experience', // Alert Message
                [
                    {
                        text: 'Cancel',
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel',
                    },
                    {
                        text: 'Proceed',
                        onPress: () => {
                            logCookInteraction();
                            navigation.goBack();
                        },
                    },
                ],
                { cancelable: false }
            );
        }
    };

    if (!Array.isArray(instructions) || instructions.length === 0) { 
        return (
            <View style={styles.container}>
                <Text style={styles.instructions}>Sorry! No instructions available.</Text>
            </View>
        );
    }

    return (
        <View style={styles.flexContainer}>
            <ScrollView contentContainerStyle={[styles.view, { paddingBottom: 20 }]}>
                <Text style={styles.header}>{label}'s {instructions.length} Steps</Text>
                <View style={styles.container}>
                    {instructions.map((step, index) => (
                        <Animated.View
                            key={index}
                            style={{ opacity: fadeAnims[index] }}>
                            <Text style={styles.instructions}>Step {index + 1}: {step}</Text>
                        </Animated.View>
                    ))}
                </View>
            </ScrollView>
            <TouchableOpacity style={[styles.button, { marginVertical: 20 }]} onPress={handleNextStep}>
                <Text style={styles.buttonText}>
                    {currentStepIndex < instructions.length - 1 ? "Next Step" : "Done"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    flexContainer: {
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: '#fff', // This ensures the button is at the bottom
    },
    view: {
        padding: 20,
        backgroundColor: '#fff',
    },
    container: {
        padding: 20,
        backgroundColor: '#fff',
    },
    instructions: {
        fontSize: 16,
        color: '#000',
        marginBottom: 20,
    },
    button: {
        backgroundColor: 'black',
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    header: {
        textAlign:'center',
        color: 'black',
        fontSize: 22,
        fontWeight: 'bold',
    },
});

export default RecipeInstructionsScreen;
