/* eslint-disable react/prop-types */
import { usePrevious } from "@mantine/hooks";
import cx from "classnames";
import { dissoc } from "icepick";
import { useEffect, useState } from "react";
import type { WithRouterProps } from "react-router";
import { t } from "ttag";
import _ from "underscore";

import ActionButton from "metabase/components/ActionButton";
import { LoadingAndErrorWrapper } from "metabase/components/LoadingAndErrorWrapper";
import Button from "metabase/core/components/Button";
import Link from "metabase/core/components/Link";
import CS from "metabase/css/core/index.css";
import DashboardS from "metabase/css/dashboard.module.css";
import { DashboardGridConnected } from "metabase/dashboard/components/DashboardGrid";
import { DashboardTabs } from "metabase/dashboard/components/DashboardTabs";
import { DASHBOARD_PARAMETERS_PDF_EXPORT_NODE_ID } from "metabase/dashboard/constants";
import {
  DashboardContextProvider,
  useDashboardContext,
} from "metabase/dashboard/context";
import * as Urls from "metabase/lib/urls";
import { ParametersList } from "metabase/parameters/components/ParametersList";
import { addUndo } from "metabase/redux/undo";
import { Box } from "metabase/ui";
import { getValuePopulatedParameters } from "metabase-lib/v1/parameters/utils/parameter-values";
import type { Dashboard, DashboardId } from "metabase-types/api";

import { FixedWidthContainer } from "../../components/Dashboard/DashboardComponents";
import { useDashboardUrlQuery } from "../../hooks/use-dashboard-url-query";
import { DashboardTitle } from "../DashboardApp/DashboardTitle";
import { XrayIcon } from "../XrayIcon";

import S from "./AutomaticDashboardApp.module.css";
import { SuggestionsSidebar } from "./SuggestionsSidebar";
import { useDispatch } from "metabase/lib/redux";
import { invalidateTags } from "metabase/api/tags";
import { dashboardApi } from "metabase/api";

type AutomaticDashboardAppRouterProps = WithRouterProps<{ splat: string }>;

const getDashboardId = ({
  params: { splat },
  location: { hash },
}: AutomaticDashboardAppRouterProps) =>
  `/auto/dashboard/${splat}${hash.replace(/^#?/, "?")}`;

export const AutomaticDashboardAppInner = ({
  savedDashboardId,
  setSavedDashboardId,
}: {
  savedDashboardId: DashboardId | null;
  setSavedDashboardId: (id: DashboardId | null) => void;
}) => {
  const {
    dashboard,
    tabs,
    parameters,
    parameterValues,
    setParameterValue,
    slowCards,
    selectedTabId,
    isHeaderVisible,
  } = useDashboardContext();

  const dispatch = useDispatch();

  const saveDashboard = (dashboard: Omit<Dashboard, "id">) =>
    dispatch(dashboardApi.endpoints.saveDashboard.initiate(dashboard));

  const invalidateCollections = () => invalidateTags(null, ["collection"]);

  // pull out "more" related items for displaying as a button at the bottom of the dashboard
  const more = dashboard && dashboard.more;
  const related = dashboard && dashboard.related;

  const hasSidebar = related && Object.keys(related).length > 0;

  const save = async () => {
    if (dashboard) {
      // remove the transient id before trying to save
      const { data: newDashboard } = await saveDashboard(
        dissoc(dashboard, "id"),
      );
      if (!newDashboard) {
        return;
      }

      invalidateCollections();
      dispatch(
        addUndo({
          message: (
            <div className={cx(CS.flex, CS.alignCenter)}>
              {t`Your dashboard was saved`}
              <Link
                className={cx(CS.link, CS.textBold, CS.ml1)}
                to={Urls.dashboard(newDashboard)}
              >
                {t`See it`}
              </Link>
            </div>
          ),
          icon: "dashboard",
        }),
      );

      setSavedDashboardId(newDashboard.id);
    }
  };

  return (
    <>
      <DashboardTitle />

      <div
        className={cx(CS.relative, "AutomaticDashboard", {
          "AutomaticDashboard--withSidebar": hasSidebar,
        })}
      >
        <div className="" style={{ marginRight: hasSidebar ? 346 : undefined }}>
          {isHeaderVisible && (
            <div
              className={cx(CS.bgWhite, CS.borderBottom)}
              data-testid="automatic-dashboard-header"
            >
              <div className={CS.wrapper}>
                <FixedWidthContainer
                  data-testid="fixed-width-dashboard-header"
                  isFixedWidth={dashboard?.width === "fixed"}
                >
                  <div className={cx(CS.flex, CS.alignCenter, CS.py2)}>
                    <XrayIcon />
                    <div>
                      <h2 className={cx(CS.textWrap, CS.mr2)}>
                        {dashboard && <TransientTitle dashboard={dashboard} />}
                      </h2>
                    </div>
                    {savedDashboardId != null ? (
                      <Button className={CS.mlAuto} disabled>{t`Saved`}</Button>
                    ) : (
                      <ActionButton
                        className={cx(CS.mlAuto, CS.textNoWrap)}
                        success
                        borderless
                        actionFn={save}
                      >
                        {t`Save this`}
                      </ActionButton>
                    )}
                  </div>
                  {dashboard && tabs && tabs.length > 1 && (
                    <div className={cx(CS.wrapper, CS.flex, CS.alignCenter)}>
                      <DashboardTabs dashboardId={dashboard.id} />
                    </div>
                  )}
                </FixedWidthContainer>
              </div>
            </div>
          )}

          <div className={cx(CS.wrapper, CS.pb4)}>
            {parameters && parameters.length > 0 && (
              <div className={cx(CS.px1, CS.pt1)}>
                <FixedWidthContainer
                  id={DASHBOARD_PARAMETERS_PDF_EXPORT_NODE_ID}
                  data-testid="fixed-width-filters"
                  isFixedWidth={dashboard?.width === "fixed"}
                >
                  <ParametersList
                    className={CS.mt1}
                    parameters={getValuePopulatedParameters({
                      parameters,
                      values: parameterValues,
                    })}
                    setParameterValue={setParameterValue}
                  />
                </FixedWidthContainer>
              </div>
            )}
            <LoadingAndErrorWrapper
              className={cx(DashboardS.Dashboard, CS.p1, CS.flexFull)}
              loading={!dashboard}
              noBackground
            >
              {() =>
                dashboard && (
                  <DashboardGridConnected
                    isXray
                    dashboard={dashboard}
                    slowCards={slowCards}
                    selectedTabId={selectedTabId}
                    isEditing={false}
                    isEditingParameter={false}
                    clickBehaviorSidebarDashcard={null}
                    downloadsEnabled={false}
                    autoScrollToDashcardId={undefined}
                    reportAutoScrolledToDashcard={_.noop}
                  />
                )
              }
            </LoadingAndErrorWrapper>
          </div>
          {more && (
            <div className={cx(CS.flex, CS.justifyEnd, CS.px4, CS.pb4)}>
              <Link to={more} className={CS.ml2}>
                <Button iconRight="chevronright">{t`Show more about this`}</Button>
              </Link>
            </div>
          )}
        </div>
        {hasSidebar && (
          <Box
            className={cx(
              CS.absolute,
              CS.top,
              CS.right,
              CS.bottom,
              S.SuggestionsSidebarWrapper,
            )}
          >
            <SuggestionsSidebar related={related} />
          </Box>
        )}
      </div>
    </>
  );
};

export const AutomaticDashboardApp = (
  props: AutomaticDashboardAppRouterProps,
) => {
  const dashboardId = getDashboardId(props);
  const previousPathname = usePrevious(props.location.pathname);

  const [savedDashboardId, setSavedDashboardId] = useState<DashboardId | null>(
    null,
  );

  useEffect(() => {
    if (props.location.pathname !== previousPathname) {
      setSavedDashboardId(null);

      window.scrollTo(0, 0);
    }
  }, [props.location.pathname, previousPathname, dashboardId]);

  useDashboardUrlQuery(props.router, props.location);

  return (
    <DashboardContextProvider dashboardId={dashboardId}>
      <AutomaticDashboardAppInner
        savedDashboardId={savedDashboardId}
        setSavedDashboardId={setSavedDashboardId}
      />
    </DashboardContextProvider>
  );
};

const TransientTitle = ({ dashboard }: { dashboard: Dashboard }) =>
  dashboard.transient_name ? (
    <span>{dashboard.transient_name}</span>
  ) : dashboard.name ? (
    <span>{dashboard.name}</span>
  ) : null;
