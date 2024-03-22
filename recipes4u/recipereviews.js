import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from './firebaseconfig'; // Adjust the import based on your Firebase setup
import { getFirestore, collection, query, where, getDocs, serverTimestamp, addDoc} from 'firebase/firestore';

export default function RecipeReviewsScreen({ route }) {
    const [reviews, setReviews] = useState([]);
    const [reviewText, setReviewText] = useState('');
    const [reviewSentiment, setReviewSentiment] = useState(null);
    const { image,label } = route.params;
    const getReviewCardBackgroundColor = (sentiment) => sentiment === 1 ? '#e8f5e9' : '#ffebee'; // #ffebee is a very light shade of red
    const db = getFirestore();
  
    const fetchReviews = async () => {
        try {
          const interactionsRef = collection(db, 'interactions');
          const q = query(interactionsRef, where('user_id', '==', auth.currentUser.uid), where('recipe_id', '==', label), where('interaction_type', '==', 'review'));
          const querySnapshot = await getDocs(q);
          const reviewsFetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReviews(reviewsFetched);
        } catch (error) {
          console.error('Error fetching reviews:', error);
        }
      };
      
      useEffect(() => {
        fetchReviews();
      }, [label, fetchReviews]);
  
      const logReview = async () => {
        console.log('Starting to log review...');
        if (reviewText && reviewSentiment !== null) {
          const reviewData = {
            review_text: reviewText,
            review_sentiment: reviewSentiment,
            user_email: auth.currentUser ? auth.currentUser.email : 'anonymous',
          };
          try {
            await logInteraction('review', reviewData);
            await sendReviewToBackend(reviewText, reviewSentiment);
            console.log('Review logged and sent to backend.');
            setReviewText('');
            setReviewSentiment(null);
            await fetchReviews();
          } catch (error) {
            console.error('Error logging review:', error);
          }
        } else {
          console.error('Review text or sentiment not provided.');
        }
      };

      const logInteraction = async (interactionType, additionalData = {}) => {
        console.log(`Logging interaction: ${interactionType}`);
        try {
          const db = getFirestore();
          const interactionData = {
            user_id: auth.currentUser ? auth.currentUser.uid : 'anonymous',
            recipe_id: label, // Make sure this is correctly pointing to the recipe's label
            interaction_type: interactionType,
            timestamp: serverTimestamp(),
            ...additionalData,
          };
          await addDoc(collection(db, 'interactions'), interactionData);
          console.log(`Interaction logged: ${interactionType}`);
        } catch (error) {
          console.error('Error logging interaction:', error);
        }
      };

      const sendReviewToBackend = async (reviewText, reviewSentiment) => {
        console.log('Sending review to backend...');
        const reviewData = {
          label: label, // Ensure this is correctly set
          user_email: auth.currentUser ? auth.currentUser.email : 'anonymous',
          review_text: reviewText,
          review_sentiment: reviewSentiment,
        };
      
        fetch('http://your.network.ip.address:3005/api/recipes/review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reviewData),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to send review to backend');
          }
          return response.json();
        })
        .then(data => console.log('Review successfully sent to backend:', data))
        .catch(error => console.error('Error sending review to backend:', error));
      };      

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.labelText}>{label}</Text>
    <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={reviewText}
          onChangeText={setReviewText}
          placeholder="Write a review..."
          multiline
        />
        <View style={styles.sentimentButtons}>
          <TouchableOpacity onPress={() => setReviewSentiment(1)} style={[styles.sentimentButton, reviewSentiment === 1 && styles.sentimentButtonActive]}>
            <Ionicons name="happy" size={24} color={reviewSentiment === 1 ? 'white' : 'green'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setReviewSentiment(0)} style={[styles.sentimentButton, reviewSentiment === 0 && styles.sentimentButtonActive]}>
            <Ionicons name="sad" size={24} color={reviewSentiment === 0 ? 'white' : 'red'} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={logReview} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.headerText}>Reviews({reviews.length})</Text>
      {reviews.map((review, index) => (
  <View key={index} style={[styles.reviewCard, {backgroundColor: getReviewCardBackgroundColor(review.review_sentiment)}]}>
    <Ionicons name={review.review_sentiment === 1 ? 'happy' : 'sad'} size={24} color={review.review_sentiment === 1 ? 'green' : 'red'} />
    <Text style={styles.reviewText}>{review.user_email}: {review.review_text}</Text>
  </View>
))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
  },
  labelText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize:20,
    marginBottom:10
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    alignSelf:'center',
    marginBottom:10
  },
  reviewCard: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewText: {
    marginLeft:4,
    color: 'darkgreen',
    flex: 1,
  },
  inputContainer: {
    marginTop: 20,
  },
  input: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  sentimentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  sentimentButton: {
    padding: 10,
    borderRadius: 20,
  },
  sentimentButtonActive: {
    backgroundColor: 'green',
  },
  submitButton: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom:15,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize:16,
    marginBottom:10
  },
});
