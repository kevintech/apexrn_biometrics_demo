create or replace package "DEMO_BIOMETRICS_API" as

  function enroll(p_username VARCHAR2
                , p_signature VARCHAR2
                , p_public_key VARCHAR2)
  return boolean;

  procedure auth(p_public_key VARCHAR2 DEFAULT NULL
                , p_signature VARCHAR2 DEFAULT NULL);

end "DEMO_BIOMETRICS_API";
/