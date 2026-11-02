# SOMMYART CONNECT COMMUNITY 

AWKA CONNECT Community App (Web App)

Build a modern, mobile-first Progressive Web App (PWA) called AWKA CONNECT.

The app should have a clean premium UI using the official AWKA CONNECT brand colours:

Primary Orange (#F57C00)

Dark Brown (#3B1F12)

White (#FFFFFF)

Light Cream background (#FFF8F2)

Use rounded cards, smooth animations, subtle shadows and plenty of white space.

The uploaded AWKA CONNECT logo should be used as:

Splash screen

App launcher icon

Login screen logo

Header logo

The application should encourage installation on Android and iPhone using the native "Install App" prompt.

Purpose

The app is only for collecting community member information and displaying important announcements.

No complicated features.

Simple. Fast. Modern.

Landing Page

Display:

AWKA CONNECT Logo

Welcome text

Connect • Engage • Grow

Button

"Join Community"

Registration Form

Collect the following information:

Real Name

Required

Nickname

Required

Day of Birth

Dropdown

1–31

Month of Birth

Dropdown

January–December

Occupation

Required

Profile Picture

Upload image

Allow:

Camera

Gallery

Crop image into a square

Compress before upload

After submission show

"Welcome to AWKA CONNECT!"

with a nice confetti animation.

Home Screen

The home screen should contain

Announcement Banner

At the very top

Large horizontal banner

Announcements should move continuously from right to left like an LED scrolling display.

Example

"🎉 Welcome to AWKA CONNECT! Stay active and don't miss our weekly activities."

The admin should be able to change this announcement easily.

Member Profile Card

Show

Profile picture

Real name

Nickname

Occupation

Birthday

Install Prompt

Prompt users to install the app.

If not installed

Display a beautiful card:

📱 Install AWKA CONNECT

"Get faster access by installing the app on your device."

Button

Install Now

Automatically trigger the browser install prompt when available.

Admin Features

Create a hidden Admin page.

Admin can:

View all registered members

Edit member details

Delete members

Update scrolling announcement

Export members to CSV

Search members

Sort members alphabetically

Database

Use Supabase.

Create a Members table containing:

id

real_name

nickname

birth_day

birth_month

occupation

profile_picture

created_at

Notifications

Support Push Notifications.

When the admin posts an announcement,

Users receive:

Browser Push Notification

and

The announcement appears immediately in the scrolling banner.

UI Style

Modern

Friendly

Minimal

Premium

Rounded corners

Soft shadows

Smooth transitions

Responsive

Optimised for phones first

Dark mode support

Technical Requirements

Build as a Progressive Web App (PWA)

Mobile-first responsive design

Installable on Android, iPhone, Windows and Mac

Use React with TypeScript

Tailwind CSS

Supabase Authentication (Admin only)

Supabase Database

Supabase Storage for profile pictures

Form validation

Image compression before upload

Fast loading

Offline support using service workers

Clean, modular codebase

Nice Micro-Animations

Smooth page transitions

Button hover and tap effects

Floating cards

Fade-in content

Confetti after successful registration

Animated scrolling announcement banner

Loading skeletons while fetching data

Overall Goal

Create a polished, professional community web app that feels like a native mobile application. It should be lightweight, easy to use, visually aligned with the AWKA CONNECT brand, and focused on collecting member information while keeping everyone informed through real-time scrolling announcements and push notifications.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sommyart-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a298617b-cbde-409b-ade3-ca2d66d3dab0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
