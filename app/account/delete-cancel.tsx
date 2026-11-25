import React from 'react';
import { Redirect } from 'expo-router';

export default function DeleteCancelDeepLink() {
  return <Redirect href="/account/delete-scheduled" />;
}
