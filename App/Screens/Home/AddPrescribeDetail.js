import { useScrollToTop } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  launchCamera as _launchCamera,
  launchImageLibrary as _launchImageLibrary,
} from 'react-native-image-picker';
import { TextInput } from 'react-native-paper';
import { BounceInRight, BounceOutRight } from 'react-native-reanimated';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCollapsibleHeader } from 'react-navigation-collapsible';
import { theme } from '../../Constants/theme';

import { useTranslation } from 'react-i18next';
import RNFS from 'react-native-fs';
import ButtonComponent from '../../Components/UI/ButtonComponent';
import DatePickerFullComponent from '../../Components/UI/DatePickerFullComponent';
import DropdownComponent from '../../Components/UI/DropdownComponent';
import ErrorModelComponent from '../../Components/UI/ErrorModelComponent';
import LoadingModalComponent from '../../Components/UI/LoadingModalComponent';
import ModalComponent from '../../Components/UI/ModalComponent';
import {
  getDBConnection,
  getDosage,
  getMedicines,
  saveDosage,
  saveMedicines,
} from '../../Database/DbService';
import { addMedicine, updateMedicine } from '../../Services/DatabaseService';
import { convert12HourTo24Hour } from '../../utils/helper';

let launchImageLibrary = _launchImageLibrary;
let launchCamera = _launchCamera;

const AddPrescribeDetail = ({navigation, route}) => {
  const {t} = useTranslation();
  const [docName, setDocName] = useState(null);
  const [hospName, setHospName] = useState(null);
  const [medName, setMedName] = useState(null);
  const [prescribId, setPrescribId] = useState(null);
  const [medNameErr, setMedNameErr] = useState(null);
  const [con_detail, setCon_detail] = useState(null);
  const [dose, setDose] = useState(null);
  const [medType, setMedType] = useState(null);
  const [medFreq, setMedFreq] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectFromDate, setSelectFromDate] = useState(new Date());
  const [openCalender1, setOpenCalender1] = useState(false);
  const [selectToDate, setSelectToDate] = useState(new Date());
  const [selectMinToDate, setSelectMinToDate] = useState(new Date());
  const [openCalender2, setOpenCalender2] = useState(false);
  const [selectTime1, setSelectTime1] = useState(new Date());
  const [selectTime2, setSelectTime2] = useState(new Date());

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [selectWTime, setSelectWTime] = useState(new Date());
  const [selectBTime, setSelectBTime] = useState(new Date());
  const [selectLTime, setSelectLTime] = useState(new Date());
  const [selectDTime, setSelectDTime] = useState(new Date());
  const [defaultSet, setDefaultSet] = useState(null);
  const [medSchedules, setMedSchedules] = useState([]);
  const [openCalendars, setOpenCalendars] = useState(Array(1).fill(false));
  const [medId, setMedId] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState(false);
  const [errorText, setErrorText] = useState(null);
  const [redirect, setRedirect] = useState(false);
  const [page, setPage] = useState(false);
  const [loading, setLoading] = useState(false);

  const ref = useRef(null);
  console.log('Params: ', route.params);
  useEffect(() => {
    if (route.params.edit) {
      let value = route.params.prescribe;
      let item = route.params.item;
      console.log('Items: ', new Date(item.from_date));
      setPrescribId(value.id);
      setDocName(value.doctor_name);
      setHospName(value.hospital_name);
      setMedName(value.med_name);
      setMedName(item.name);
      setCon_detail(item.consumption);
      setDose(item.dose);
      setMedType(item.type);
      setMedFreq(item.frequency);
      setSelectFromDate(new Date(item.from_date));
      setSelectToDate(new Date(item.to_date));
      setMedId(item.id);
      let img = value.photo;
      img && setSelectedImage(img.replace('file://', ''));
      const schedules = item.schedule_times;
      const dates = schedules.map(
        schedule => new Date(convertTimeToDate(schedule)),
      );
      console.log(dates);
      setMedSchedules(dates);
      console.log(medSchedules);
    } else if (route.params.item_detail) {
      setDefaultSet(route.params.item_detail);
      console.log(route.params);
      setDocName(route.params.item_detail.doctor_name);
      setHospName(route.params.item_detail.hospital_name);
      setPrescribId(route.params.item_detail.id);
    } else {
      setDocName(route.params.d_name);
      setHospName(route.params.h_name);
      setPrescribId(route.params.id);
    }
  }, []);
  const prevMedSchedules = useRef(medSchedules);

  useEffect(() => {
    console.log('Form Date: ', medSchedules);

    const updatedSelectTimes = [...medSchedules];
    const updatedOpenCalendars = [...openCalendars];
    console.log('Select Times: ', updatedSelectTimes);

    if (medFreq > medSchedules.length) {
      for (let i = medSchedules.length; i < medFreq; i++) {
        updatedSelectTimes.push(new Date());
        updatedOpenCalendars.push(false);
      }
    } else if (medFreq < medSchedules.length) {
      updatedSelectTimes.splice(medFreq);
      updatedOpenCalendars.splice(medFreq);
    }

    // Compare with the previous medSchedules using useRef
    if (
      JSON.stringify(prevMedSchedules.current) !==
      JSON.stringify(updatedSelectTimes)
    ) {
      setMedSchedules(updatedSelectTimes);
      prevMedSchedules.current = updatedSelectTimes; // Update ref to track new state
    }

    setOpenCalendars(updatedOpenCalendars);
  }, [medFreq]);

  useScrollToTop(ref);

  const {onScroll, containerPaddingTop, scrollIndicatorInsetTop, translateY} =
    useCollapsibleHeader({
      navigationOptions: {
        headerStyle: {
          backgroundColor: theme.COLORS.white,
          textAlign: 'center',
          elevation: 0,
          shadowOpacity: 0,
        },
      },
    });

  const stickyHeaderHeight = 60;
  const windowHeight = Dimensions.get('window').height;

  const dosage = [
    {label: '1', value: '1'},
    {label: '2', value: '2'},
    {label: '3', value: '3'},
    {label: '4', value: '4'},
    {label: '5', value: '5'},
    {label: '6', value: '6'},
    {label: '7', value: '7'},
    {label: '8', value: '8'},
    {label: '9', value: '9'},
    {label: '10', value: '10'},
  ];

  const frequency = [
    {id: 1, label: '1', value: '1'},
    {id: 2, label: '2', value: '2'},
    {id: 3, label: '3', value: '3'},
    {id: 4, label: '4', value: '4'},
  ];

  const type = [
    {label: t('tablet'), value: 'TAB'},
    {label: t('capsule'), value: 'CAP'},
    {label: t('drops'), value: 'Drops'},
    {label: t('syrup'), value: 'Syrup'},
    {label: t('liquid'), value: 'Liquid'},
    {label: t('injection'), value: 'Injection'},
    {label: t('spray'), value: 'Spray'},
  ];

  const consumption = [
    {label: t('beforeFood'), value: 'Before Food'},
    {label: t('afterFood'), value: 'After Food'},
  ];

  const storeData = async (value, navigate) => {
    try {
      // let existingTransactions = await getTransaction();
      // if (existingTransactions != null) {
      //   const updatedTransactions = [...existingTransactions, value]; // notice the newData here
      //   console.log('--' + updatedTransactions);
      //   await AsyncStorage.setItem(
      //     'prescritpions',
      //     JSON.stringify(updatedTransactions),
      //   );
      // } else {
      //   const jsonValue = JSON.stringify(value);
      //   console.log(jsonValue);
      //   await AsyncStorage.setItem('prescritpions', jsonValue);
      // }

      const db = await getDBConnection();
      let transactions = await getMedicines(db);
      const newData = [
        ...transactions,
        {
          id: transactions.length
            ? transactions.reduce((acc, cur) => {
                if (cur.id > acc.id) return cur;
                return acc;
              }).id + 1
            : 0,
          prescriptionId: value.p_id,
          docName: value.docName,
          hospName: value.hospName,
          medImage: value.medImage,
          medName: value.medName,
          fromDate: value.fromDate,
          toDate: value.toDate,
          medDose: value.medDose,
          medType: value.medType,
          medFrequency: value.medFreq,
          medConsumption: value.consumption,
          medSchedule1: value.time1,
          medSchedule2: value.time2,
          medSchedule3: value.time3,
          medSchedule4: value.time4,
        },
      ];
      await saveMedicines(db, newData).then(() => {
        console.log('success');
        if (navigate) {
          navigation.replace('MainTab');
        } else {
          navigation.replace('AddPrescribeDetail', {
            id: prescribId,
            d_name: docName,
            h_name: hospName,
          });
        }
      });
    } catch (e) {
      // saving error
      console.log(e);
    }
  };

  const addDosage = async data => {
    try {
      const db = await getDBConnection();

      await data.map(async i => {
        let pre_dosage = await getDosage(db);
        const newData = [
          ...pre_dosage,
          {
            id: pre_dosage.length
              ? pre_dosage.reduce((acc, cur) => {
                  if (cur.id > acc.id) return cur;
                  return acc;
                }).id + 1
              : 0,
            prescriptionId: i.p_id,
            medImage: i.medImage,
            medName: i.medName,
            fromDate: i.fromDate,
            toDate: i.toDate,
            medDose: i.medDose,
            medType: i.medType,
            medFrequency: i.medFreq,
            medConsumption: i.consumption,
            consumptionTime: i.consumptionTime,
            consumed: 'false',
          },
        ];

        await saveDosage(db, newData).then(() => {
          console.log('success');
        });
      });
    } catch (e) {
      // saving error
      console.log(e);
    }
  };

  const openImagePicker = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, handleResponse);
  };

  const handleCameraLaunch = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchCamera(options, handleResponse);
  };

  const handleResponse = async response => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
      Alert.alert('User cancelled image picker');
    } else if (response.error) {
      console.log('Image picker error: ', response.error);
      Alert.alert('Image picker error: ', response.error);
    } else {
      let imageUri = response.uri || response.assets?.[0]?.uri;

      const fileName =
        response.assets[0].fileName || `profile_${Date.now()}.jpg`;
      const destinationPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      try {
        // Move the file to a local storage directory
        await RNFS.moveFile(imageUri, destinationPath);
        setSelectedImage(destinationPath);
        console.log('Image saved to:', destinationPath);
      } catch (error) {
        console.error('Error saving image:', error);
        Alert.alert('Error saving image:', error.message);
      }
    }
  };

  const handleTimeChange = (index, time) => {
    const newSelectTimes = [...medSchedules];
    newSelectTimes[index] = time;
    setMedSchedules(newSelectTimes);
  };

  const handleCalendarOpen = (index, isOpen) => {
    const newOpenCalendars = [...openCalendars];
    newOpenCalendars[index] = isOpen;
    setOpenCalendars(newOpenCalendars);
  };
  console.log('Any Updates', medSchedules);

  const modalResponse = () => {
    setConfirm(false);
    if (page) navigation.navigate('TreatmentScreen');
  };

  function convertTimeToDate(timeString) {
    // Get the current date
    const date = new Date();
    const {hours, minutes} = convert12HourTo24Hour(timeString);

    // Set hours and minutes to the date
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    // Convert it to ISO string
    const isoString = date.toISOString();
    return isoString;
  }

  const handleSubmit = async (event, set = '') => {
    event.preventDefault();

    try {
      setLoading(true);
      if (medName === null || medName === '') {
        setMedNameErr(true);
        // const msg = t('pleaseEnterMedicineName')
        setErrorText(t('pleaseEnterMedicineName'));
        setError(true);
        return;
      }
      if (dose === null || dose === '') {
        setErrorText(t('pleaseEnterDosage'));
        setError(true);

        return;
      }
      if (medType === null || medType === '') {
        setErrorText(t('pleaseEnterType'));
        setError(true);

        return;
      }
      if (medFreq === null) {
        setErrorText(t('pleaseEnterFrequency'));
        setError(true);

        return;
      }
      if (con_detail == null) {
        setErrorText(t('pleaseEnterConsumptionDetail'));
        setError(true);

        return;
      }

      // console.log('Schedules: ', medSchedules);
      let res;
      if (route.params.edit) {
        res = await updateMedicine(
          medId,
          medName,
          '',
          selectFromDate.toISOString().split('T')[0],
          selectToDate.toISOString().split('T')[0],
          medFreq,
          dose,
          con_detail,
          medType,
          '',
          selectedImage,
          medSchedules.map(schedule =>
            schedule.toLocaleString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          ),
          t,
        );
        // console.log('Button Status: ', res);
        setPage(true);
        setConfirm(true);
        // console.log('Confirm Status:', confirm);
      } else {
        res = await addMedicine(
          prescribId,
          medName,
          '',
          selectFromDate.toISOString().split('T')[0],
          selectToDate.toISOString().split('T')[0],
          medFreq,
          dose,
          con_detail,
          medType,
          '',
          selectedImage,
          medSchedules.map(schedule =>
            schedule.toLocaleString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          ),
          t,
        );
        if (res) {
          if (set === 'add') {
            setRedirect(true);
            setMedName(null);
            setMedFreq(null);
            setMedType(null);
            setCon_detail(null);
            setDose(null);
            setSelectedImage(null);
            setMedSchedules(Array(frequency).fill(new Date()));
            setSelectFromDate(new Date());
            setSelectToDate(new Date());
            setOpenCalendars(Array(frequency).fill(false));
            setPage(false);
            setConfirm(true);
          } else {
            setPage(true);
            setConfirm(true);
          }
        }
      }
    } catch (error) {
      console.log('Error: ', error);
    } finally {
      setLoading(false);
    }

    // console.log('Button Status: ', set);
  };

  const callDateError = () => {
    setErrorText(t('pleaseEnterValidDate'));
    setError(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={loading} transparent={true} animationType="none">
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Modal>
      <Animated.ScrollView
        onScroll={onScroll}
        contentContainerStyle={{
          paddingTop: containerPaddingTop + stickyHeaderHeight,
          alignItems: 'center',
          paddingBottom: 40,
          paddingHorizontal: 20,
        }}
        scrollIndicatorInsets={{
          top: scrollIndicatorInsetTop + stickyHeaderHeight,
        }}
        ref={ref}
        entering={BounceInRight.duration(1000)}
        exiting={BounceOutRight.duration(1000)}>
        <Image
          source={require('../../Assets/p3.jpg')}
          style={{width: 50, height: 50, marginTop: 50}}
        />
        <Text style={styles.title}>{t('addMedicine')}</Text>
        <View style={{...styles.img, marginTop: 20}}>
          <ImageBackground
            source={selectedImage ? {uri: `file://${selectedImage}`} : null}
            style={styles.img}
            resizeMode="cover">
            <MaterialCommunityIcons
              name="image-plus"
              size={55}
              color={theme.COLORS.darkBlue_gradient1}
              onPress={() => setIsBottomSheetOpen(true)}
            />
          </ImageBackground>
        </View>

        {/*--------- Modal -----------*/}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isBottomSheetOpen}
          onRequestClose={() => setIsBottomSheetOpen(false)}>
          <View style={styles.centeredView}>
            <View
              style={[
                styles.bottomSheet,
                {
                  height: windowHeight * 0.3,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                },
              ]}>
              <TouchableOpacity
                onPress={() => {
                  handleCameraLaunch();
                  setIsBottomSheetOpen(false);
                }}
                style={{
                  ...styles.imgSmall,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Image
                  source={require('../../Assets/camera.png')}
                  style={styles.imgSmall}
                  resizeMode="contain"
                />
                <Text>{t('camera')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  openImagePicker();
                  setIsBottomSheetOpen(false);
                }}
                style={{
                  ...styles.imgSmall,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Image
                  source={require('../../Assets/gallery.png')}
                  style={styles.imgSmall}
                  resizeMode="contain"
                />
                <Text>{t('gallery')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/*--------- Modal end -----------*/}

        <TextInput
          mode="outlined"
          value={medName}
          onChangeText={text => {
            setMedName(text);
          }}
          error={medNameErr}
          label={t('medicineName')}
          outlineColor={theme.COLORS.darkBlue_gradient1}
          outlineStyle={{borderRadius: 100}}
          activeOutlineColor={theme.COLORS.darkBlue_gradient2}
          textColor={theme.COLORS.darkBlue_gradient2}
          style={styles.input}
        />
        <DatePickerFullComponent
          onPress={() => setOpenCalender1(true)}
          value={selectFromDate.toDateString()}
          onChangeText={t => setSelectFromDate(t)}
          label={t('fromDate')}
          onConfirm={date => {
            setOpenCalender1(false);
            setSelectFromDate(date);
            setSelectMinToDate(
              new Date().setDate(new Date(date).getDate() + 1),
            );
          }}
          onCancel={() => setOpenCalender1(false)}
          openCalender={openCalender1}
          selected={selectFromDate}
        />
        <DatePickerFullComponent
          onPress={() => setOpenCalender2(true)}
          value={selectToDate.toDateString()}
          onChangeText={t => setSelectToDate(t)}
          label={t('toDate')}
          onConfirm={date => {
            if (new Date(date) >= new Date(selectFromDate)) {
              setSelectToDate(date);
            } else {
              callDateError();
            }
            setOpenCalender2(false);
          }}
          onCancel={() => setOpenCalender2(false)}
          openCalender={openCalender2}
          selected={selectToDate}
        />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
          }}>
          <DropdownComponent
            data={dosage}
            value={dose}
            onChange={item => setDose(item.value)}
            placeholder={t('dosage')}
          />
          <DropdownComponent
            data={type}
            value={medType}
            onChange={item => setMedType(item.value)}
            placeholder={t('type')}
          />
          <DropdownComponent
            data={frequency}
            value={medFreq}
            onChange={item => setMedFreq(item.value)}
            placeholder={t('frequency')}
          />
        </View>

        <DropdownComponent
          data={consumption}
          value={con_detail}
          onChange={item => {
            setCon_detail(item.value);
            if (item.value === 'after_food') {
              setSelectTime1(selectLTime);
              setSelectTime2(selectDTime);
            }
            if (item.value === 'before_food') {
              setSelectTime1(selectLTime);
              setSelectTime2(selectDTime);
            }
          }}
          placeholder={t('consumptionDetail')}
          full={{width: '100%'}}
        />

        {Array.from({length: medFreq}).map((_, index) => (
          <View key={index} style={styles.row}>
            <DatePickerFullComponent
              key={index}
              onPress={() => handleCalendarOpen(index, true)}
              value={
                medSchedules[index]?.toLocaleString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }) || ''
              }
              openCalender={openCalendars[index]}
              onConfirm={date => {
                handleCalendarOpen(index, false);
                handleTimeChange(index, date);
              }}
              onCancel={() => handleCalendarOpen(index, false)}
              selected={medSchedules[index] || new Date()}
              label={`${t('schedule')} ${index + 1}`}
              mode="time" // Use "time" for time picker
            />
          </View>
        ))}

        <ButtonComponent
          onPress={e => handleSubmit(e, 'sub')}
          text={t('saveAndExit')}
        />
        {/* </LinearGradient> */}
      </Animated.ScrollView>

      <Animated.View
        style={{
          transform: [{translateY}],
          position: 'absolute',
          backgroundColor: theme.COLORS.white,
          top: containerPaddingTop,
          height: stickyHeaderHeight,
          width: '120%',
          marginTop: 20,
          borderColor: theme.COLORS.black,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.23,
          shadowRadius: 2.62,
          elevation: 8,
        }}>
        <View
          pointerEvents="none"
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
          }}>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}
            style={{
              alignSelf: 'flex-start',
              height: '100%',
              marginRight: 15,
              marginTop: 10,
            }}>
            <FontAwesome6
              pointerEvents="none"
              name="arrow-left-long"
              size={22}
              color={theme.COLORS.darkBlue_gradient2}
            />
          </TouchableOpacity>
          <Image
            source={require('../../Assets/p1.jpg')}
            resizeMode="contain"
            style={{
              width: 40,
              height: 40,
            }}
          />
          <View style={{marginLeft: 15}}>
            <Text
              style={{
                fontSize: 18,
                color: theme.COLORS.darkBlue_gradient2,
                fontWeight: 'bold',
              }}>
              {t('dr')} {docName}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.COLORS.dark_grey,
                fontWeight: 'bold',
              }}>
              {hospName}
            </Text>
          </View>
        </View>
      </Animated.View>

      {!route.params.edit && (
        <Animated.View
          style={{
            backgroundColor: theme.COLORS.black,
            position: 'fixed',
            width: '100%',
            height: 40,
            bottom: 0,
          }}>
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 10,
              paddingHorizontal: 20,
            }}>
            <Text style={{color: theme.COLORS.white}}>
              {t('addMoreMedicines')}
            </Text>
            <TouchableOpacity
              onPress={e => {
                handleSubmit(e, 'add');
              }}>
              <Text
                style={{
                  color: theme.COLORS.white,
                  fontSize: 18,
                  fontWeight: 'bold',
                }}>
                {t('add')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      <ModalComponent
        visible={confirm}
        onClose={modalResponse}
        text={t('reminderCreatedSuccessfully')}
        page={redirect}
      />
      <ErrorModelComponent
        visible={error}
        onClose={() => setError(false)}
        text={errorText}
      />
      <LoadingModalComponent
        visible={loading}
        onClose={() => setError(false)}
        text={errorText}
      />
    </SafeAreaView>
  );
};

export default AddPrescribeDetail;

const styles = StyleSheet.create({
  indicator: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
    // paddingHorizontal: 20,
  },

  title: {
    color: theme.COLORS.darkBlue_gradient2,
    marginVertical: 10,
    fontSize: 20,
    fontWeight: '400',
  },
  dropdown_cont: {
    color: theme.COLORS.darkBlue_gradient2,
    borderRadius: 5,
  },
  img: {
    width: '100%',
    height: 160,
    backgroundColor: '#DFDFEF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgSmall: {
    width: '50%',
    height: 60,
  },
  input: {
    width: '100%',
    marginTop: 15,
    backgroundColor: theme.COLORS.white,
  },
  selectedTextStyle: {
    fontSize: 14,
    color: theme.COLORS.darkBlue_gradient2,
  },
  placeholderStyle: {fontSize: 12, color: theme.COLORS.darkBlue_gradient1},
  iconStyle: {tintColor: theme.COLORS.darkBlue_gradient2},
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 70,
    marginVertical: 20,
    borderRadius: 100,
    width: '40%',
    height: 50,
    padding: 5,
    backgroundColor: theme.COLORS.blue,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 8,
  },
  btnText: {color: theme.COLORS.white, fontSize: 18, fontWeight: '600'},
  dropdown: {
    marginVertical: 20,
    backgroundColor: theme.COLORS.white,
    width: '30%',
    borderWidth: 1,
    borderRadius: 100,
    borderColor: theme.COLORS.darkBlue_gradient1,
    height: 50,
    paddingHorizontal: 10,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: theme.COLORS.white,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 23,
    paddingHorizontal: 25,
    bottom: 0,
    // borderWidth: 1,
    // borderBottomWidth: 0,
    borderColor: theme.COLORS.black,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 8,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
});
