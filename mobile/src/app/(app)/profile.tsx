import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorMessage, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { api, getProfilePhotoUrl } from '../../lib/api';
import { colors } from '../../theme';

export default function ProfileScreen() {
  const { student, token, logout, updateStudent } = useAuth();
  const [error, setError] = useState('');
  const [photoMessage, setPhotoMessage] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleChangePhoto() {
    setError('');
    setPhotoMessage('');

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset || !token) {
        throw new Error('Unable to access the selected image or student account.');
      }

      setUploadingPhoto(true);
      let upload: FormData | { profile_photo: string };
      if (Platform.OS === 'web' && asset.file) {
        const formData = new FormData();
        formData.append('profile_photo', asset.file, 'profile-photo.jpg');
        upload = formData;
      } else if (Platform.OS !== 'web') {
        const photo = await ImageManipulator.ImageManipulator.manipulate(asset.uri, {
          maxWidth: 512,
          maxHeight: 512,
        }).renderAsync();
        const compressedPhoto = await photo.saveAsync({
          format: ImageManipulator.SaveFormat.JPEG,
          compress: 0.75,
          base64: true,
        });

        if (!compressedPhoto.base64) {
          throw new Error('Unable to prepare the selected photo for upload.');
        }

        upload = { profile_photo: compressedPhoto.base64 };
      } else {
        throw new Error('Unable to access the selected image on this device.');
      }

      updateStudent(await api.uploadProfilePhoto(token, upload));
      setPhotoMessage('Profile photo updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update your profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setError('');

    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign out.');
    } finally {
      setSigningOut(false);
    }
  }

  const initials = student?.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={styles.title}>My profile</Text>
        <Text style={styles.subtitle}>Your student details linked to support requests.</Text>
      </View>

      <View style={styles.profileCard}>
        <Pressable
          accessibilityLabel="Change profile photo"
          accessibilityRole="button"
          disabled={uploadingPhoto}
          onPress={() => void handleChangePhoto()}
          style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
        >
          {student?.profile_photo_url ? (
            <Image
              source={{ uri: getProfilePhotoUrl(student.profile_photo_url) ?? undefined }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>{initials || 'M'}</Text>
          )}
          <View style={styles.cameraBadge}>
            <Text style={styles.cameraBadgeText}>✎</Text>
          </View>
        </Pressable>
        <Text style={styles.photoHint}>
          {uploadingPhoto ? 'Uploading photo…' : 'Tap to add or change your photo'}
        </Text>
        <Text style={styles.name}>{student?.name}</Text>
        <Text style={styles.school}>{student?.college || 'MSEUF Student'}</Text>
        {student?.student_id ? (
          <View style={styles.studentBadge}>
            <Text style={styles.studentBadgeText}>STUDENT ACCOUNT</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Personal information</Text>
        <Text style={styles.cardSubtitle}>Details associated with your account</Text>
        <ProfileField label="EMAIL ADDRESS" value={student?.email} />
        <ProfileField label="STUDENT ID" value={student?.student_id} />
        <ProfileField label="COLLEGE" value={student?.college} />
        <ProfileField label="PROGRAM / COURSE" value={student?.program} />
        <ProfileField label="YEAR LEVEL" value={student?.year_level} />
      </View>

      <View style={styles.resourcesCard}>
        <Text style={styles.cardTitle}>Student resources</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(app)/notifications')}
          style={({ pressed }) => [styles.resourceLink, pressed && styles.avatarPressed]}
        >
          <View style={styles.resourceIcon}>
            <Text style={styles.resourceIconText}>◈</Text>
          </View>
          <View style={styles.resourceBody}>
            <Text style={styles.resourceTitle}>Notifications</Text>
            <Text style={styles.resourceSubtitle}>Ticket replies and payment queue updates</Text>
          </View>
          <Text style={styles.resourceArrow}>›</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(app)/knowledge-base')}
          style={({ pressed }) => [styles.resourceLink, pressed && styles.avatarPressed]}
        >
          <View style={styles.resourceIcon}>
            <Text style={styles.resourceIconText}>◇</Text>
          </View>
          <View style={styles.resourceBody}>
            <Text style={styles.resourceTitle}>Help center</Text>
            <Text style={styles.resourceSubtitle}>Browse guides and troubleshooting steps</Text>
          </View>
          <Text style={styles.resourceArrow}>›</Text>
        </Pressable>
      </View>

      {photoMessage ? (
        <View accessibilityRole="alert" style={styles.successBox}>
          <Text style={styles.successText}>{photoMessage}</Text>
        </View>
      ) : null}
      {error ? <ErrorMessage message={error} /> : null}
      <PrimaryButton
        title="Sign out"
        onPress={() => void handleSignOut()}
        loading={signingOut}
      />
      <Text style={styles.footer}>Manuel S. Enverga University Foundation</Text>
    </ScrollView>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || 'Not provided'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 30,
  },
  heading: {
    gap: 6,
  },
  eyebrow: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  profileCard: {
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.white,
    padding: 22,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  avatar: {
    overflow: 'visible',
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    borderRadius: 23,
    backgroundColor: colors.mint,
  },
  avatarPressed: {
    opacity: 0.8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  avatarText: {
    color: colors.greenDark,
    fontSize: 24,
    fontWeight: '900',
  },
  cameraBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 12,
    backgroundColor: colors.green,
  },
  cameraBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  photoHint: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },
  name: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  school: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  studentBadge: {
    marginTop: 5,
    borderRadius: 20,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  studentBadgeText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  successBox: {
    borderRadius: 12,
    backgroundColor: colors.successSoft,
    padding: 12,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  detailsCard: {
    gap: 15,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.white,
    padding: 17,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 1,
  },
  resourcesCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.white,
    padding: 17,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 1,
  },
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
  },
  resourceIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  resourceIconText: {
    color: colors.green,
    fontSize: 18,
    fontWeight: '800',
  },
  resourceBody: {
    flex: 1,
    gap: 3,
  },
  resourceTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  resourceSubtitle: {
    color: colors.muted,
    fontSize: 11,
  },
  resourceArrow: {
    color: colors.green,
    fontSize: 23,
    fontWeight: '700',
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: -10,
    color: colors.muted,
    fontSize: 12,
  },
  field: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  fieldValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
  },
});
