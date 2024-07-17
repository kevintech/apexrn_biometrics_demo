create or replace package body "DEMO_BIOMETRICS_API" as

  function enroll(p_username VARCHAR2
                , p_signature VARCHAR2
                , p_public_key VARCHAR2)
  return boolean
  is
    l_is_sign_valid     BOOLEAN := FALSE;
  begin
    l_is_sign_valid := dbms_crypto.verify(src => UTL_RAW.cast_to_raw(p_username)
                                , sign => utl_encode.base64_decode(UTL_RAW.cast_to_raw(p_signature))
                                , pub_key => UTL_RAW.cast_to_raw(p_public_key)
                                , pubkey_alg => dbms_crypto.key_type_rsa
                                , sign_alg => dbms_crypto.sign_sha256_rsa);

    IF l_is_sign_valid THEN
      INSERT INTO demo_biometrics(username, public_key)
      VALUES (p_username, p_public_key);
    END IF;

    RETURN l_is_sign_valid;
  EXCEPTION 
    WHEN OTHERS THEN
      ROLLBACK;
      RETURN FALSE;
  end enroll;

  PROCEDURE auth(p_public_key VARCHAR2 DEFAULT NULL
              , p_signature VARCHAR2 DEFAULT NULL)
  IS
    l_biometrics_id   NUMBER;
    l_username        VARCHAR2(255);
    l_is_sign_valid   BOOLEAN := FALSE;
  BEGIN
    IF p_public_key IS NULL OR p_signature IS NULL THEN
      apex_error.add_error (
        p_message          => 'This device is not properly enrolled into Biometric Authentication',
        p_display_location => apex_error.c_inline_in_notification
      );
    ELSE
      SELECT id, username
      INTO l_biometrics_id, l_username
      FROM demo_biometrics
      WHERE public_key = p_public_key;

      l_is_sign_valid := dbms_crypto.verify(src => UTL_RAW.cast_to_raw(l_username)
                                , sign => utl_encode.base64_decode(UTL_RAW.cast_to_raw(p_signature))
                                , pub_key => UTL_RAW.cast_to_raw(p_public_key)
                                , pubkey_alg => dbms_crypto.key_type_rsa
                                , sign_alg => dbms_crypto.sign_sha256_rsa);

      IF l_is_sign_valid THEN
        apex_authentication.post_login( 
          p_username => l_username, 
          p_password => 'fake password lol',
          p_uppercase_username => TRUE
        );
      ELSE
        apex_error.add_error (
          p_message          => 'Unable to validate your Biometric data',
          p_display_location => apex_error.c_inline_in_notification
        );
      END IF;
    END IF;

    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        apex_error.add_error (
          p_message          => 'Invalid Login Credentials',
          p_display_location => apex_error.c_inline_in_notification
        );
      WHEN OTHERS THEN
        apex_error.add_error (
          p_message          => 'Invalid Login Credentials',
          p_display_location => apex_error.c_inline_in_notification
        );
  END auth;

END "DEMO_BIOMETRICS_API";
/