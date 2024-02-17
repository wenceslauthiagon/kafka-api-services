#!/bin/bash

FILECRT="$1"

echo "Generate JWK from certificate file: $FILECRT"
echo


# Get path to read file cert and remove the header and footer
x5c=`openssl x509 -in $FILECRT | grep -v -- ----- | tr -d '\n'`


# for each line compute x5t by following these steps:
#  1. "echo $x5c|base64 -d" -> base64 decode x5c certificate
#  2. "openssl sha1 -binary" -> compute certificate's SHA-1 in binary format
#  3. "base64" -> base64 encode it
#  4. "tr -d '='|tr '/+' '_-'" -> convert from base64 to base64url as demanded by RFC7515: https://tools.ietf.org/html/rfc7515#page-12
computed_x5t=`echo $x5c|base64 -d|openssl sha1 -binary|base64|tr -d '='|tr '/+' '_-'`

echo
echo "computed x5t: $computed_x5t"
echo


# for each line compute x5t#S256 by following these steps:
#  1. "echo $x5c|base64 -d" -> base64 decode x5c certificate
#  2. "openssl sha256 -binary" -> compute certificate's SHA-256 in binary format
#  3. "base64" -> base64 encode it
#  4. "tr -d '='|tr '/+' '_-'" -> convert from base64 to base64url as demanded by RFC7515: https://tools.ietf.org/html/rfc7515#page-12
computed_x5tS256=`echo $x5c|base64 -d|openssl sha256 -binary|base64|tr -d '='|tr '/+' '_-'`

echo
echo "computed x5t#S256: $computed_x5tS256"
echo


#  1. The cert fingerprint is the KID value
#  2. remove the ':' from the fingerprint
#  3. remove 'SHA1 Fingerprint=' prefix from the value
computed_kid=`openssl x509 -fingerprint -noout -sha1 -in $FILECRT | tr -d ':' | cut -d "=" -f 2`

echo
echo "computed kid: $computed_kid"
echo


#  1. Get modulus and convert from base64 to base64url
#  2. "base64" -> base64 encode it
#  3. "tr -d '='|tr '/+' '_-'" -> convert from base64 to base64url as demanded by RFC7515: https://tools.ietf.org/html/rfc7515#page-12
computed_modulus=`openssl x509 -modulus -noout -in $FILECRT | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n'`

echo
echo "computed modulus: $computed_modulus"
echo


#  1. Print JWK and format with jq
output='
{
  "keys": [
    {
      "kty": "RSA",
      "n": "'"$computed_modulus"'",
      "e": "AQAB",
      "kid": "'"$computed_kid"'",
      "x5t": "'"$computed_x5t"'",
      "x5t#S256": "'"$computed_x5tS256"'",
      "x5c": [
        "'"$x5c"'",
        "GET THIS VALUE FROM FILE.CRT",
        "GET THIS VALUE FROM FILE.CRT",
        "GET THIS VALUE FROM FILE.CRT"
      ],
      "key_ops": [
        "verify"
      ]
    }
  ]
}
'
echo
echo "-------------------"
echo
echo "Just copy and paste:"
echo
echo $output | jq
echo
