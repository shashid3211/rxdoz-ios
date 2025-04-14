import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { TextInput } from 'react-native-paper';
import { theme } from '../../Constants/theme';
// import * as RNLocalize from 'react-native-localize';
// import moment from 'moment';
// import 'moment/locale/hi';

const TimePickerComponent = ({
  openCalender,
  defaultTime,
  onChangeText,
  confirmDate,
  cancelCalender,
  label,
  mode,
  calender,
  img,
}) => {
  // const {locale} = RNLocalize.getLocales()[0].languageCode;
  // moment.locale(locale);

  const {t} = useTranslation();
  return (
    <View
      pointerEvents="none"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
      }}>
      <Image
        source={img}
        resizeMode="contain"
        style={{
          width: '15%',
          height: '75%',
          marginHorizontal: 15,
          marginTop: 10,
        }}
      />
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '70%',
        }}
        onPress={openCalender}>
        <TextInput
          pointerEvents="none"
          mode="outlined"
          value={defaultTime.toLocaleString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          label={label}
          outlineColor={theme.COLORS.darkBlue_gradient2}
          activeOutlineColor={theme.COLORS.darkBlue_gradient2}
          outlineStyle={{borderRadius: 100}}
          textColor={theme.COLORS.darkBlue_gradient1}
          style={styles.input}
          showSoftInputOnFocus={false}
          editable={false}
          onChangeText={onChangeText}
          right={
            <TextInput.Icon
              icon="clock-edit"
              color={theme.COLORS.darkBlue_gradient2}
              // onPress={() => setOpenCalender1(true)}
            />
          }
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={{padding: 10, marginTop: 10}}
        onPress={openCalender}>
        <Text style={styles.btnText1} pointerEvents="none">{t('reset')}</Text>
      </TouchableOpacity>
      <DatePicker
        modal
        mode={mode}
        open={calender}
        date={defaultTime}
        onConfirm={confirmDate}
        onCancel={cancelCalender}
        buttonColor={theme.COLORS.darkBlue_gradient2}
        dividerColor={theme.COLORS.darkBlue_gradient2}
        minuteInterval={10}
        // locale={locale}
      />
    </View>
  );
};

export default TimePickerComponent;

const styles = StyleSheet.create({
  input: {
    width: '100%',
    marginTop: 10,
    backgroundColor: theme.COLORS.white,
  },
  btnText1: {
    color: theme.COLORS.darkBlue_gradient2,
    textDecorationLine: 'underline',
  },
});
