import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { TextInput } from 'react-native-paper';
import { theme } from '../../Constants/theme';
// import * as RNLocalize from 'react-native-localize';
// import moment from 'moment';
// import 'moment/locale/hi';

const DatePickerFullComponent = ({
  onPress,
  value,
  onChangeText,
  openCalender,
  onConfirm,
  onCancel,
  selected,
  label,
  mode = 'date',
  width = {width: '100%'},
}) => {
  // const {locale} = RNLocalize.getLocales()[0].languageCode;
  // moment.locale(locale);
  const [formattedValue, setFormattedValue] = React.useState('');

  const handleConfirm = date => {
    setFormattedValue(date.toString()); // Format date using toString()
    onConfirm(date);
  };
  return (
    <View pointerEvents="none">
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={onPress}>
        <TextInput
          pointerEvents="none"
          mode="outlined"
          value={value}
          label={label}
          // error={selectToDateErr}
          outlineColor={theme.COLORS.darkBlue_gradient1}
          outlineStyle={{borderRadius: 100}}
          activeOutlineColor={theme.COLORS.darkBlue_gradient2}
          textColor={theme.COLORS.darkBlue_gradient2}
          style={[styles.input, width]}
          showSoftInputOnFocus={false}
          editable={false}
          onChangeText={onChangeText}
          right={
            <TextInput.Icon
              icon={mode === 'date' ? 'calendar-blank' : 'clock'}
              color={theme.COLORS.darkBlue_gradient1}
            />
          }
        />
      </TouchableOpacity>
      <DatePicker
        modal
        mode={mode}
        open={openCalender}
        date={selected}
        onConfirm={onConfirm}
        // minimumDate={new Date()}
        onCancel={onCancel}
        buttonColor={theme.COLORS.darkBlue_gradient2}
        dividerColor={theme.COLORS.darkBlue_gradient2}
        minuteInterval={1}
        // locale={locale}
      />
    </View>
  );
};

export default DatePickerFullComponent;

const styles = StyleSheet.create({
  input: {
    // flex: 1,
    // width: '100%',
    marginTop: 15,
    backgroundColor: theme.COLORS.white,
  },
});
