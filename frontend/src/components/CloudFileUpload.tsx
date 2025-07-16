import React from 'react';
import { Button } from './ui/button';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const GOOGLE_CLIENT_ID = '823879578566-8vfstjvbon50a9ri11jujfmg39scm1ho.apps.googleusercontent.com'; // from your screenshot
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY'; // get from Google Cloud Console
const GOOGLE_PICKER_SCOPE = ['https://www.googleapis.com/auth/drive.readonly'];

export default function CloudFileUpload({ projectId, onUploadComplete }) {
  const handleGoogleDrive = () => {
    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => window.gapi.load('client:auth2', initPicker);
      document.body.appendChild(script);
    } else {
      window.gapi.load('client:auth2', initPicker);
    }
  };

  function initPicker() {
    window.gapi.client.init({
      apiKey: GOOGLE_API_KEY,
      clientId: GOOGLE_CLIENT_ID,
      scope: GOOGLE_PICKER_SCOPE.join(' '),
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    }).then(() => {
      window.gapi.auth2.getAuthInstance().signIn().then(() => {
        createPicker(window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token);
      });
    });
  }

  function createPicker(oauthToken) {
    window.gapi.load('picker', () => {
      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS)
        .setOAuthToken(oauthToken)
        .setDeveloperKey(GOOGLE_API_KEY)
        .setCallback((data) => pickerCallback(data, oauthToken))
        .build();
      picker.setVisible(true);
    });
  }

  function pickerCallback(data, oauthToken) {
    if (data.action === window.google.picker.Action.PICKED) {
      const file = data.docs[0];
      // Send file.id and oauthToken to backend
      fetch('/api/documents/upload/cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          provider: 'google',
          file_id: file.id,
          oauth_token: oauthToken,
          file_name: file.name,
        }),
      })
        .then(res => res.json())
        .then(onUploadComplete);
    }
  }

  return (
    <Button onClick={handleGoogleDrive} variant="outline">
      Upload from Google Drive
    </Button>
  );
}
