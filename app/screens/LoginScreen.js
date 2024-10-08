import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Screen from '../components/Screen';
import colors from '../config/colors';
import AppHeader from '../components/AppHeader';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import AppText from '../components/AppText';
import AppProgress from '../components/AppProgress';
import { fetchLoginUser } from '../functions/apiUsers';
import { createOkAlert } from '../functions/alerts';
import baseFetch from '../functions/baseFetch';

const validationSchema = Yup.object().shape({
    username: Yup.string().required('Username is required'),
    password: Yup.string().required('Password is required'),
});

function LoginScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const tokens = await fetchLoginUser(values);
            if (tokens) {
                await AsyncStorage.setItem('refreshToken', tokens.refresh);
                await AsyncStorage.setItem('accessToken', tokens.access);

                const user = await baseFetch(`core/users/userId/`, "GET");
                setLoading(false);
                if (user.group_id) {
                    await AsyncStorage.setItem('groupId', user.group_id);
                    navigation.navigate('Home');
                } else {
                    navigation.navigate('EnterGroup');
                }
            } else {
                setLoading(false);
                createOkAlert('Invalid credentials');
            }
        } catch (error) {
            setLoading(false);
            console.error(error);
            createOkAlert('Something went wrong');
        }
    };

    return (
        <Screen style={styles.container}>
            <AppHeader title="Login" />
            <View style={styles.form}>
                <Formik
                    initialValues={{ username: '', password: '' }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ handleChange, handleSubmit, values, errors, touched }) => (
                        <>
                            <AppTextInput
                                placeholder="Username"
                                style={styles.textInput}
                                value={values.username}
                                onChangeText={handleChange('username')}
                            />
                            {touched.username && errors.username && <AppText style={styles.errorText}>{errors.username}</AppText>}

                            <AppTextInput
                                placeholder="Password"
                                style={styles.textInput}
                                value={values.password}
                                onChangeText={handleChange('password')}
                                secureTextEntry
                            />
                            {touched.password && errors.password && <AppText style={styles.errorText}>{errors.password}</AppText>}
                            <AppButton title="Login" style={styles.button} onPress={handleSubmit} />
                        </>
                    )}
                </Formik>
            </View>
            {loading && (
                <AppProgress loading={loading} />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background,
    },
    form: {
        padding: 20,
    },
    textInput: {
        marginVertical: 15,
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    },
    button: {
        marginVertical: 15,
    },
});

export default LoginScreen;
