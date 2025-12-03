// 'use client';

// import { useEffect, useState } from 'react';
// import liff from '@line/liff';

// export default function LiffProvider({ children }: { children: React.ReactNode }) {
//   const [liffReady, setLiffReady] = useState(false);

//   useEffect(() => {
//     const init = async () => {
//       try {
//         await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

//         // ★ 未ログインならログインさせる
//         if (!liff.isLoggedIn()) {
//           liff.login();
//           return; // ← ★ リロードさせるため
//         }

//         setLiffReady(true);
//       } catch (err) {
//         console.error('LIFF initialization failed', err);
//       }
//     };

//     init();
//   }, []);

//   if (!liffReady) {
//     return <div>Loading...</div>;
//   }

//   return <>{children}</>;
// }
