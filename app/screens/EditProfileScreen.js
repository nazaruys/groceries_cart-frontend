import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, StatusBar, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';

import Screen from '../components/Screen';
import colors from '../config/colors';
import AppHeader from '../components/AppHeader';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import { fetchPatchUser, fetchUser } from '../functions/apiUsers';
import { createOkAlert } from '../functions/alerts';
import AppProgress from '../components/AppProgress';

// Define the validation schema, including email validation
const validationSchema = Yup.object().shape({
    username: Yup.string().required('Username is required'),
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
});

function EditProfileScreen() {
    const navigation = useNavigation();

    const [userData, setUserData] = useState();
    const [isDataFetched, setIsDataFetched] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            navigation.goBack();
            return true;
        });

        return () => backHandler.remove();
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                const data = await fetchUser();
                if (data) {
                    setUserData(data);
                    setIsDataFetched(true);
                }
            };
            fetchData();
        }, [])
    );

    const onSave = async (values) => {
        setLoading(true);
        console.log(values);
        const [response, data] = await fetchPatchUser(values);
        console.log(data)
        if (data) {
            if (response.status === 200) {
                navigation.goBack()
            } else if (response.status === 400) {
                if (data.username) {
                    createOkAlert(data.username[0])
                } else if (data.name) {
                    createOkAlert(data.name[0])
                } else if (data.email) {
                    createOkAlert(data.email[0])
                } else {
                    createOkAlert('Something went wrong')
                }
            }
        } else {
            createOkAlert('Something went wrong')
        }
        setLoading(false);
    };

    return (
        <Screen style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.backgroundSecondary} />
            <AppHeader title={'Edit Profile'} />
            <View style={styles.content}>
                {isDataFetched && (
                    <Formik
                        initialValues={{ 
                            username: userData.username, 
                            name: userData.name, 
                            email: userData.email // Add email to initial values
                        }}
                        validationSchema={validationSchema}
                        onSubmit={async (values) => {
                            onSave(values);
                        }}
                    >
                        {({ handleChange, handleSubmit, values, errors, touched }) => (
                            <>
                                <AppTextInput
                                    placeholder='Username'
                                    style={styles.textInput}
                                    maxLength={50}
                                    value={values.username}
                                    onChangeText={handleChange('username')}
                                />
                                {touched.username && errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                                
                                <AppTextInput
                                    placeholder='Name'
                                    style={styles.textInput}
                                    maxLength={50}
                                    value={values.name}
                                    onChangeText={handleChange('name')}
                                />
                                {touched.name && errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                                
                                {/* Editable email input */}
                                <AppTextInput
                                    placeholder='Email'
                                    style={styles.textInput}
                                    maxLength={50}
                                    value={values.email}
                                    onChangeText={handleChange('email')}
                                />
                                {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                                <AppButton title='Save' onPress={handleSubmit} style={styles.submitButton} />
                            </>
                        )}
                    </Formik>
                )}
            </View>
            {loading && <AppProgress loading={loading} />}
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundSecondary,
    },
    content: {
        paddingHorizontal: '5%',
        paddingTop: 25,
    },
    textInput: {
        marginVertical: 12,
    },
    submitButton: {
        marginVertical: 12,
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    },
});

export default EditProfileScreen;
