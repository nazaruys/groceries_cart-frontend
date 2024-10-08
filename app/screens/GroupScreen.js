import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, FlatList, StatusBar, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';

import AppHeader from '../components/AppHeader';
import Screen from '../components/Screen';
import colors from '../config/colors';
import UserCard from '../components/UserCard';
import AppText from '../components/AppText';
import DropDownList from '../components/DropDownList';
import { fetchUser } from '../functions/apiUsers';
import { 
    createChangeGroupPrivacyAlert, 
    createGiveAdminAlert, 
    createNotAdminAlert, 
    createRemoveUserAlert, 
    createExitGroupAlert, 
    createUnBlockMemberAlert,
    createOkAlert
} from '../functions/alerts';
import baseFetch from '../functions/baseFetch';
import AppProgress from '../components/AppProgress';


function GroupScreen() {
    const navigation = useNavigation()
    const [isPrivate, setIsPrivate] = useState(false)
    const [members, setMembers] = useState([]);
    const [membersBlocked, setMembersBlocked] = useState([]);
    const [userData, setUserData] = useState();
    const [dropDownOpen, setDropDownOpen] = useState();

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
            setLoading(true)
            const newUserData = await fetchUser()
            newUserData && setUserData(newUserData)

            const members = await baseFetch('group/groups/groupId/members/', 'GET')
            members && setMembers(members)

            const data = await baseFetch(`group/groups/groupId/`, 'GET')
            data && setIsPrivate(data.private)

            const groupData = await baseFetch(`group/groups/groupId/`, 'GET')
            const newMembersBlocked = groupData ? groupData.users_blacklist : []
            for (const memberId of newMembersBlocked) {
                const member = await baseFetch(`core/users/${memberId}/`, 'GET')
                if (member && !membersBlocked.includes(member)) {
                    setMembersBlocked([...membersBlocked, member]);
                }
            }
            setLoading(false)
          };
          fetchData();
        }, [])
    );

    return (
        <Screen style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.backgroundSecondary} />
            <AppHeader title='Group' />
            {members && userData && 
                <FlatList
                    ListHeaderComponent={
                        <View style={styles.content}>
                            <View style={styles.groupInfoContainer}>
                                <AppText style={styles.groupCode}>{userData.group_id}</AppText>
                                <View style={styles.iconsContainer}>
                                    <Ripple onPress={userData.admin_of ? () => createChangeGroupPrivacyAlert(isPrivate, setIsPrivate) : createNotAdminAlert} style={styles.icon}>
                                        <MaterialCommunityIcons name={isPrivate ? 'lock' : 'lock-open'} size={40} />
                                    </Ripple>
                                    <Ripple onPress={createExitGroupAlert} style={styles.icon}>
                                        <MaterialCommunityIcons name='logout' size={40} />
                                    </Ripple>
                                </View>
                            </View>
                            {userData && <UserCard style={styles.user} user={userData} />}
                        </View>
                    }
                    style={styles.membersList}
                    data={members.filter(member => member.id !== userData.id)}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <UserCard 
                            user={item}
                            iconShown={userData.admin_of ? true : false}
                            blocked={false}
                            onPressDeleteIcon={() => createRemoveUserAlert(item, setMembers, membersBlocked, setMembersBlocked)}
                            onPressAdminIcon={() => createGiveAdminAlert(item, setMembers, setUserData)}
                        />
                    )}
                    ListFooterComponent={
                        <View>
                            <DropDownList title='BLOCKED' style={styles.blockedListDropdown} isOpen={dropDownOpen} setIsOpen={setDropDownOpen} />
                            {dropDownOpen &&
                            <FlatList
                                style={styles.membersBlockedList}
                                data={membersBlocked}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <UserCard 
                                        user={item}
                                        iconShown={true}
                                        blocked={true}
                                        onPressDeleteIcon={userData.admin_of ? () => createUnBlockMemberAlert(item, setMembers, membersBlocked, setMembersBlocked) : () => createOkAlert('Only admin can unblock users')}/>
                                )}
                            />}
                        </View>
                    }
                />
            }
            {loading && (
                <AppProgress loading={loading} />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundSecondary
    },
    content: {
        paddingTop: 25,
    },
    groupInfoContainer: {
        paddingHorizontal: '5%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25
    },
    groupCode: {
        fontSize: 30
    },
    user: {
        marginBottom: 20
    },
    membersList: {
        paddingHorizontal: '5%',
    },
    membersBlockedList: {
        marginTop: 12
    },
    iconsContainer: {
        flexDirection: 'row'
    },
    icon: {
        marginHorizontal: 5,
    },
    blockedListDropdown: {
        
    }
})

export default GroupScreen;