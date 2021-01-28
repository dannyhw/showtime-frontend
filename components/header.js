import React, { useContext, useEffect } from "react";
import Link from "next/link";
import useWindowSize from "../hooks/useWindowSize";
import AppContext from "../context/app-context";
import mixpanel from "mixpanel-browser";

const Header = () => {
  const context = useContext(AppContext);

  // Try to log us in if it's not already in state
  useEffect(() => {
    const getUserFromCookies = async () => {
      // login with our own API
      const userRequest = await fetch("/api/user");
      try {
        const user_data = await userRequest.json();
        context.setUser(user_data);

        mixpanel.identify(user_data.publicAddress);
        if (user_data.email) {
          mixpanel.people.set({
            $email: user_data.email, // only reserved properties need the $
            USER_ID: user_data.publicAddress, // use human-readable names
            //"Sign up date": USER_SIGNUP_DATE,    // Send dates in ISO timestamp format (e.g. "2020-01-02T21:07:03Z")
            //"credits": 150    // ...or numbers
          });
        } else {
          mixpanel.people.set({
            //$email: user_data.email, // only reserved properties need the $
            USER_ID: user_data.publicAddress, // use human-readable names
            //"Sign up date": USER_SIGNUP_DATE,    // Send dates in ISO timestamp format (e.g. "2020-01-02T21:07:03Z")
            //"credits": 150    // ...or numbers
          });
        }
      } catch {
        // Not logged in
        // Switch from undefined to null
        context.setUser(null);
      }
    };

    if (!context?.user) {
      getUserFromCookies();
      getMyLikes();
      getMyFollows();
    }
  }, [context?.user]);

  // Keep track of window size
  const windowSize = useWindowSize();
  useEffect(() => {
    context.setWindowSize(windowSize);
  }, [windowSize]);

  const getMyLikes = async () => {
    // get our likes
    const myLikesRequest = await fetch("/api/mylikes");
    try {
      const my_like_data = await myLikesRequest.json();
      context.setMyLikes(my_like_data.data);
    } catch {
      //
    }
  };

  useEffect(() => {
    if (!context?.myLikes) {
      getMyLikes();
    }
  }, [context?.myLikes]);

  const getMyFollows = async () => {
    // get our follows
    const myFollowsRequest = await fetch("/api/myfollows");
    try {
      const my_follows_data = await myFollowsRequest.json();
      context.setMyFollows(my_follows_data.data);
    } catch {
      //
    }
  };

  useEffect(() => {
    if (!context?.myFollows) {
      getMyFollows();
    }
  }, [context?.myFollows]);

  return (
    <header>
      <div className="w-10/12 mx-auto py-5 flex flex-col md:flex-row items-center ">
        <Link href="/">
          <a
            className="flex flex-row showtime-header-link mb-4 md:mb-0 uppercase items-center text-left mr-auto"
            onClick={() => {
              mixpanel.track("Logo button click");
            }}
          >
            <img
              src="/logo_sm.jpg"
              style={{ height: 48, width: 48, borderRadius: 5 }}
            />
            <div className="mx-4">Showtime</div>
          </a>
        </Link>
        <div className="flex-grow items-center text-right">
          <nav className="text-base">
            <Link href="/c/superrare">
              <a
                className="showtime-header-link mr-5 text-sm md:text-base"
                onClick={() => {
                  mixpanel.track("Discover button click");
                }}
              >
                Discover
              </a>
            </Link>
            <Link href="/#leaderboard">
              <a
                className="showtime-header-link mr-5 text-sm md:text-base"
                onClick={() => {
                  mixpanel.track("Top creators button click");
                }}
              >
                Top Creators
              </a>
            </Link>
            {context.user ? (
              <Link href="/p/[slug]" as={`/p/${context.user.publicAddress}`}>
                <a
                  className="showtime-login-button-outline text-sm px-3 py-2 md:text-base md:px-5 md:py-3"
                  onClick={() => {
                    mixpanel.track("Profile button click");
                  }}
                >
                  Profile
                </a>
              </Link>
            ) : (
              <Link href="/login">
                <a className="showtime-login-button-solid text-sm px-3 py-2 md:text-base  md:px-5 md:py-3">
                  {context.windowSize && context.windowSize.width > 500
                    ? "Sign in / Sign up"
                    : "Sign in"}
                </a>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
