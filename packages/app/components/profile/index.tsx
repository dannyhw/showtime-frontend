import { useCallback, useReducer, useMemo, Suspense } from "react";
import { Platform, useWindowDimensions } from "react-native";

import { useSharedValue } from "react-native-reanimated";
import { SceneRendererProps } from "react-native-tab-view-next/src";

import { useIsDarkMode } from "@showtime-xyz/universal.hooks";
import { Spinner } from "@showtime-xyz/universal.spinner";
import { tw } from "@showtime-xyz/universal.tailwind";
import { View } from "@showtime-xyz/universal.view";

import {
  defaultFilters,
  useProfileNftTabs,
  useUserProfile,
} from "app/hooks/api-hooks";
import { useBlock } from "app/hooks/use-block";
import { useContentWidth } from "app/hooks/use-content-width";
import { useTabState } from "app/hooks/use-tab-state";
import { useHeaderHeight } from "app/lib/react-navigation/elements";

import { HeaderTabView } from "design-system/tab-view/index";
import { Route } from "design-system/tab-view/src/types";

import { ErrorBoundary } from "../error-boundary";
import { FilterContext } from "./fillter-context";
import { ProfileListFilter } from "./profile-tab-filter";
import { ProfileTabList, ProfileTabListRef } from "./profile-tab-list";
import { ProfileTop } from "./profile-top";

const HEADER_LIGHT_SHADOW =
  "0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 8px rgba(0, 0, 0, 0.05)";
const HEADER_DARK_SHADOW =
  "0px 0px 2px rgba(255, 255, 255, 0.5), 0px 8px 16px rgba(255, 255, 255, 0.1)";

const ProfileScreen = ({ username }: { username: string | null }) => {
  return <Profile address={username} />;
};

type Filter = typeof defaultFilters;

const Profile = ({ address }: { address: string | null }) => {
  const { data: profileData, refresh } = useUserProfile({ address });
  const { width } = useWindowDimensions();
  const isDark = useIsDarkMode();
  const contentWidth = useContentWidth();
  const {
    data,
    // Todo: handling loading and error state.
  } = useProfileNftTabs({
    profileId: profileData?.data?.profile.profile_id,
  });
  const {
    index,
    setIndex,
    setIsRefreshing,
    isRefreshing,
    setTabRefs,
    currentTab,
  } = useTabState<ProfileTabListRef>([]);
  const animationHeaderPosition = useSharedValue(0);
  const animationHeaderHeight = useSharedValue(0);

  const { getIsBlocked } = useBlock();
  const isBlocked = getIsBlocked(profileData?.data?.profile.profile_id);

  const headerHeight = useHeaderHeight();

  const [filter, dispatch] = useReducer(
    (state: Filter, action: any): Filter => {
      switch (action.type) {
        case "collection_change":
          return { ...state, collectionId: action.payload };
        case "sort_change":
          return { ...state, sortType: action.payload };
        default:
          return state;
      }
    },
    { ...defaultFilters }
  );

  const onStartRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    // Todo: use async/await.
    currentTab?.refresh();
    setIsRefreshing(false);
  }, [currentTab, refresh, setIsRefreshing]);
  const renderScene = useCallback(
    ({
      route: { index },
    }: SceneRendererProps & {
      route: Route;
    }) => {
      const list = data?.tabs[index];
      if (!list) return null;
      return (
        <ErrorBoundary>
          <Suspense
            fallback={
              <View tw="items-center justify-center pt-20">
                <Spinner size="small" />
              </View>
            }
          >
            <ProfileTabList
              username={profileData?.data.profile.username}
              profileId={profileData?.data.profile.profile_id}
              isBlocked={isBlocked}
              list={list}
              index={index}
              ref={setTabRefs}
            />
          </Suspense>
        </ErrorBoundary>
      );
    },
    [
      data?.tabs,
      isBlocked,
      profileData?.data.profile.profile_id,
      profileData?.data.profile.username,
      setTabRefs,
    ]
  );
  const headerBgLeft = useMemo(() => {
    return Math.min(-(width - contentWidth) / 2, 0);
  }, [contentWidth, width]);

  const headerShadow = useMemo(() => {
    return isDark ? HEADER_DARK_SHADOW : HEADER_LIGHT_SHADOW;
  }, [isDark]);

  const renderHeader = useCallback(() => {
    return (
      <View tw="items-center bg-white dark:bg-black">
        {Platform.OS === "web" && (
          <View
            tw="absolute left-0 h-full w-screen bg-white dark:bg-black"
            style={{
              left: headerBgLeft,
              height: `calc(100% + 44px)`,
              // @ts-ignore
              boxShadow: headerShadow,
            }}
          />
        )}
        <View tw="web:max-w-screen-xl w-full">
          {Platform.OS === "ios" && <View tw={`h-[${headerHeight}px]`} />}
          <ProfileTop
            address={address}
            animationHeaderPosition={animationHeaderPosition}
            animationHeaderHeight={animationHeaderHeight}
            isBlocked={isBlocked}
          />
        </View>
      </View>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerBgLeft, headerShadow, headerHeight, address, isBlocked]);

  const routes = useMemo(
    () =>
      data?.tabs?.map((item, index) => ({
        title: item?.name,
        key: item?.name,
        index,
      })) ?? [],
    [data]
  );

  return (
    <FilterContext.Provider value={{ filter, dispatch }}>
      <View style={{ width: contentWidth }} tw="flex-1">
        <HeaderTabView
          onStartRefresh={onStartRefresh}
          isRefreshing={isRefreshing}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderScrollHeader={renderHeader}
          minHeaderHeight={Platform.select({
            default: headerHeight,
            android: 0,
          })}
          refreshControlTop={Platform.select({
            ios: headerHeight,
            default: 0,
          })}
          initialLayout={{
            width: contentWidth,
          }}
          style={tw.style("z-1")}
          animationHeaderPosition={animationHeaderPosition}
          animationHeaderHeight={animationHeaderHeight}
          insertStickyTabBarElement={
            Platform.OS === "web" ? (
              <View
                tw="absolute left-0 top-0 h-full w-screen bg-white dark:bg-black"
                style={{
                  left: headerBgLeft,
                  // @ts-ignore
                  boxShadow: headerShadow,
                }}
              />
            ) : null
          }
          insertTabBarElement={
            Platform.OS === "web" ? (
              <>
                <View tw="absolute -bottom-11 w-full justify-between md:bottom-1.5 md:right-10 md:w-auto">
                  <ProfileListFilter
                    collections={data?.tabs[index]?.collections || []}
                  />
                </View>
              </>
            ) : null
          }
        />
      </View>
    </FilterContext.Provider>
  );
};

export { ProfileScreen as Profile };
