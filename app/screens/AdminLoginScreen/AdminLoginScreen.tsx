import { ComponentType, FC, useMemo, useRef, useState } from "react"
import { TextInput, TextStyle, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { Button } from "@/components/Button"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField, type TextFieldAccessoryProps } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface AdminLoginScreenProps extends AppStackScreenProps<"AdminLogin"> {}

export const AdminLoginScreen: FC<AdminLoginScreenProps> = ({ navigation }) => {
  const passwordRef = useRef<TextInput>(null)

  const [password, setPassword] = useState("")
  const [isPasswordHidden, setPasswordHidden] = useState(true)
  const [isSubmitted, setSubmitted] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const { authEmail, setAuthEmail, setAuthToken, validationError } = useAuth()
  const { themed, theme: { colors } } = useAppTheme()

  const error = isSubmitted ? validationError : ""

  function handleLogin() {
    setSubmitted(true)
    setAttempts((n) => n + 1)
    if (validationError) return

    // Replace with real authentication against your backend
    setAuthToken(String(Date.now()))
    setSubmitted(false)
    setPassword("")
    navigation.goBack()
  }

  const PasswordAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isPasswordHidden ? "view" : "hidden"}
            color={colors.textDim}
            containerStyle={props.style}
            size={18}
            onPress={() => setPasswordHidden((v) => !v)}
          />
        )
      },
    [isPasswordHidden, colors.textDim],
  )

  return (
    <Screen
      preset="auto"
      backgroundColor={colors.background}
      safeAreaEdges={["top", "bottom"]}
      systemBarStyle="light"
      contentContainerStyle={themed($container)}
    >
      <View style={themed($closeRow)}>
        <PressableIcon
          icon="x"
          size={20}
          color={colors.textDim}
          onPress={() => navigation.goBack()}
        />
      </View>

      <View style={themed($lockIcon)}>
        <Ionicons name="lock-closed-outline" size={36} color={colors.tint} />
      </View>

      <Text style={themed($title)} preset="heading" weight="bold">Admin Login</Text>
      <Text style={themed($subtitle)}>
        Access is restricted to authorised mosque administrators.
      </Text>

      {attempts > 2 && (
        <Text style={themed($hint)}>
          Contact your administrator if you're having trouble logging in.
        </Text>
      )}

      <TextField
        value={authEmail ?? ""}
        onChangeText={setAuthEmail}
        containerStyle={themed($field)}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        label="Email address"
        placeholder="admin@example.com"
        helper={error}
        status={error ? "error" : undefined}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <TextField
        ref={passwordRef}
        value={password}
        onChangeText={setPassword}
        containerStyle={themed($field)}
        autoCapitalize="none"
        autoComplete="password"
        autoCorrect={false}
        secureTextEntry={isPasswordHidden}
        label="Password"
        placeholder="Enter your password"
        onSubmitEditing={handleLogin}
        RightAccessory={PasswordAccessory}
      />

      <Button
        text="Log in"
        style={themed($loginButton)}
        preset="reversed"
        onPress={handleLogin}
      />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.lg,
})

const $closeRow: ThemedStyle<ViewStyle> = () => ({
  alignItems: "flex-end",
  marginBottom: 4,
})

const $lockIcon: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  justifyContent: "center",
  width: 64,
  height: 64,
  borderRadius: 16,
  backgroundColor: colors.tintSubtle,
  marginBottom: spacing.md,
  alignSelf: "center",
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.xl,
  lineHeight: 20,
})

const $hint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.md,
  fontSize: 13,
  textAlign: "center",
})

const $field: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $loginButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})
