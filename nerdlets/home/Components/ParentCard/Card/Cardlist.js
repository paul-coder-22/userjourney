import React, { useEffect, useState } from 'react';
import { Button, Container, ListGroup, ProgressBar } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';




import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretUp } from '@fortawesome/free-solid-svg-icons';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';


// nerdGraph
import { NerdGraphQuery } from 'nr1';

const Cardlist = ({ cardName, timeUpdater, guid, colorSetter }) => {


    const [searchTerm, setSearchTerm] = useState('');


    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState({
        progressCountStatus: []
    });

    const [userData_Custom, setUserData_Custom] = useState({
        app_name: "",
        "Response time": {
            current: null,
            prev: null,
        },
        "Login Page": {
            current: null,
            prev: null,
        },
        'Partner Authentication': {
            current: null,
            prev: null,

        },
        "Home Page": {
            current: null,
            prev: null
        },
        status_val: "",
        "Synthetic availability": {
            current: null,
            prev: null,
        },
        "End user experience": {
            current: null,
            prev: null
        },
        criticalAlertCount: {
            current: null,
            prev: null
        },
        warningAlertCount: {
            current: null,
            prev: null
        },
        headlineStatus: null,
        progressCountStatus: []
    })

    const [metricComparison, setMetricCompariosn] = useState([])


    useEffect(() => {

        const fetchUserData = async () => {

            try {

                const wl_guid = "Mjc4MTY2N3xOUjF8V09SS0xPQUR8MjAzNzEy";
                let Page_url_in_key_value = {};

                var entities = [];

                const list_of_guids_Promise = await fetchNerdGraphQuery(`
           query 
             {
          actor {
                user {
                  name
                }
                account(id: 2781667) {
                  workload {
                    collection(guid: "${wl_guid}") {
                      name
                      entities {
                        guid
                      }
                    }
                  }
              }
          }
        }
        `)

                const list_of_guid_result = list_of_guids_Promise.actor.account.workload.collection.entities;


                //* Inserting all the guids
                const list_of_guids = [];

                for (var i = 0; i < list_of_guid_result.length; i++) {
                    list_of_guids.push(list_of_guid_result[i].guid);
                }

                const entity_Info_Promise = await fetchNerdGraphQuery(`
            query {
              actor {
                account(id: 2781667) {
                  id
                }
                entities(guids: [${list_of_guids.map(guid => `"${guid}"`).join(',')}]) {
                  name
                  entityType
                  type
                }
              }
            }
        `);

                const entity_info_result = entity_Info_Promise.actor.entities

                let dict = {};
                dict["infra_workloads"] = entity_info_result
                    .filter((i) => i["entityType"] === "WORKLOAD_ENTITY")
                    .map((i) => i["name"]);

                dict["synthetic"] = entity_info_result
                    .filter((i) => i["entityType"] === "SYNTHETIC_MONITOR_ENTITY")
                    .map((i) => i["name"]);



                const infra_status_Promise = await fetchNerdGraphQuery(`
            query {
              actor {
                user {
                  name
                }
                account(id: 2781667) {
                  nrql(
                    query: "from WorkloadStatus select latest(statusValue) where entity.name = 'GCC_HardwareLedQuoting'"
                  ) {
                    embeddedChartUrl
                    nrql
                    otherResult
                    rawResponse
                    staticChartUrl
                    totalResult
                  }
                }
              }
            }
          `);

                const synthetic_Promise = await fetchNerdGraphQuery(`
                query {
                  actor {
                    user {
                      name
                    }
                    account(id: 2781667) {
                      nrql(
                        query: "FROM SyntheticCheck SELECT percentage(count(result), WHERE result='SUCCESS') WHERE monitorName IN (${dict.synthetic.map(sythe => `'${sythe}'`).join(',')}) SINCE ${timeUpdater} AGO COMPARE WITH ${timeUpdater} AGO"
                      ) {
                        embeddedChartUrl
                        nrql
                        otherResult
                        rawResponse
                        staticChartUrl
                        totalResult
                      }
                    }
                  }
                }
          `);

                setUserData_Custom({
                    status_val: infra_status_Promise.actor.account.nrql.rawResponse.results[0].latest,
                    "Synthetic availability": {
                        current: synthetic_Promise.actor.account.nrql.rawResponse.current.results[0].result,
                        prev: synthetic_Promise.actor.account.nrql.rawResponse.previous.results[0].result,
                    }
                })


                const headlineStatusPromise = fetchNerdGraphQuery(`
                  query {
                    actor {
                      user {
                        name
                      }
                      account(id: 2781667) {
                        nrql(
                          query: "FROM WorkloadStatus SELECT latest(statusValue) WHERE workloadGuid='${guid}' SINCE 5 Minutes AGO"
                        ) {
                          embeddedChartUrl
                          nrql
                          otherResult
                          rawResponse
                          staticChartUrl
                          totalResult
                        }
                      }
                    }
                  }
          `)


                const criticalAlertCountPromise = fetchNerdGraphQuery(`{
                  actor {
                    user {
                      name
                    }
                account(id: 2781667) {
                nrql(
                        query: "SELECT count(*) from NrAiIncident where event = 'open' and priority = 'critical' And entity.name in ('210135-Partner Ready Portal (PRP)-Production', '212948-Next Generation Quoter-PRD', '213051-Next Gen Quote-To-Order Conversion Engine-PRD')  SINCE ${timeUpdater} AGO COMPARE WITH ${timeUpdater} AGO"
                      ) {
                        embeddedChartUrl
                        nrql
                        otherResult
                        rawResponse
                        staticChartUrl
                        totalResult
                      } 
                    }
                  }
                }
          `)

                const warningAlertCountPromise = fetchNerdGraphQuery(`{
                      actor {
                        user {
                          name
                        }
                    account(id: 2781667) {
                    nrql(
                            query: "SELECT count(*) from NrAiIncident where event = 'open' and priority = 'warning' And entity.name in ('210135-Partner Ready Portal (PRP)-Production', '212948-Next Generation Quoter-PRD', '213051-Next Gen Quote-To-Order Conversion Engine-PRD')  SINCE ${timeUpdater} AGO COMPARE WITH ${timeUpdater} AGO"
                          ) {
                            embeddedChartUrl
                            nrql
                            otherResult
                            rawResponse
                            staticChartUrl
                            totalResult
                          } 
                        }
                      }
                    }
                    
          `)

                const theProgressCountPromise = fetchNerdGraphQuery(`{
            actor {
              account(id: 2781667) {
                nrql(query: "FROM WorkloadStatus SELECT count(*) SINCE 3 HOURS AGO WHERE entity.name IN (${dict.infra_workloads.map(infra => `'${infra}'`).join(',')}) FACET statusValue TIMESERIES 18 MINUTES") {
                  embeddedChartUrl
                  nrql
                  otherResult
                  rawResponse
                  staticChartUrl
                  totalResult
                }
              }
            }
          }`)

                const fetch_arrow_color_query_Promise = fetchNerdGraphQuery(`{
            actor {
              account(id: 2781667) {
                nrql(
                  query: "FROM lookup(LookupTable_210135_PRP_PRD) SELECT standard_metric, custom_metric, warning_threshold, critical_threshold, comparison WHERE workload_name = 'PRP_Master_Workload'"
                ) {
                  embeddedChartUrl
                  nrql
                  otherResult
                  rawResponse
                  staticChartUrl
                  totalResult
                }
              }
            }
          }`)


                const [
                    criticalAlertCount,
                    warningAlertCount,
                    headlineStatus,
                    theProgressCount,
                    fetch_arrow_color_query
                ] =
                    await Promise.all([
                        criticalAlertCountPromise,
                        warningAlertCountPromise,
                        headlineStatusPromise,
                        theProgressCountPromise,
                        fetch_arrow_color_query_Promise
                    ])

                setMetricCompariosn(fetch_arrow_color_query.actor.account.nrql.rawResponse.results[0].events)

                let progressCountOccurance = getOccuranceObject(theProgressCount)
                let progressCount = formatObject(progressCountOccurance)

                setUserData({
                    progressCountStatus: progressCount
                });



                // Fetching app name
                const fetch_App_name = await fetch_App_name_Promise;
                const appName = await fetch_App_name.actor.account.nrql.rawResponse.results[0].members[0];

                // Fetching end user performance using the obtained app name
                const fetch_user_performance = await fetch_end_userPerformance_Promise(appName);
                //pagename and url in ket value pair
                const fetch_url_pagename = await fetch_URI_name_Promise;


                //separte page:urls
                fetch_url_pagename.actor.account.nrql.rawResponse.facets.forEach(
                    (e) => Page_url_in_key_value[e.name[0]] = e.name[1]
                );


                const [
                    fetch_response_time,
                    fetch_login_custom,
                    fetch_Partner_custom,
                    fetch_HomePage_custom
                ] =
                    await Promise.all([
                        fetch_response_time_Promise(appName),
                        fetch_login_custom_func(appName, Page_url_in_key_value['Login Page']),
                        fetch_Partner_custom_func(appName, Page_url_in_key_value['Partner Authentication']),
                        fetch_HomePage_custom_func(appName, Page_url_in_key_value['Home Page'])
                    ])

                setUserData_Custom(prevState => ({
                    ...prevState,
                    app_name: appName,
                    "Response time": {
                        current: fetch_response_time.actor.account.nrql.rawResponse.current.results[0].average,
                        prev: fetch_response_time.actor.account.nrql.rawResponse.previous.results[0].average,
                    },
                    'Login Page': {
                        current: fetch_login_custom.actor.account.nrql.rawResponse.current.results[0].average,
                        prev: fetch_login_custom.actor.account.nrql.rawResponse.previous.results[0].average,
                    },
                    'Partner Authentication': {
                        current: fetch_Partner_custom.actor.account.nrql.rawResponse.current.results[0].average,
                        prev: fetch_Partner_custom.actor.account.nrql.rawResponse.previous.results[0].average
                    },
                    "Home Page": {
                        current: fetch_HomePage_custom.actor.account.nrql.rawResponse.current.results[0].average,
                        prev: fetch_HomePage_custom.actor.account.nrql.rawResponse.previous.results[0].average
                    },
                    'End user experience': {
                        current: fetch_user_performance.actor.account.nrql.rawResponse.current.results[0].count,
                        prev: fetch_user_performance.actor.account.nrql.rawResponse.previous.results[0].count
                    },
                    headlineStatus: headlineStatus.actor.account.nrql.rawResponse.results[0].latest,
                    progressCountStatus: progressCount,
                    criticalAlertCount: {
                        current: criticalAlertCount.actor.account.nrql.rawResponse.current.results[0].count,
                        prev: criticalAlertCount.actor.account.nrql.rawResponse.previous.results[0].count
                    },
                    warningAlertCount: {
                        current: warningAlertCount.actor.account.nrql.rawResponse.current.results[0].count,
                        prev: warningAlertCount.actor.account.nrql.rawResponse.previous.results[0].count
                    },
                }))
                setLoading(false);
            } catch (error) {
                alert(error)
                console.error('Error fetching user data:', error);
                setError(error);
                setLoading(false);
            }
        };
        fetchUserData();

    }, [timeUpdater]);


    //* query for appName
    const fetch_App_name_Promise = fetchNerdGraphQuery(`{
      actor {
        account(id: 2781667) {
          nrql(query: "FROM lookup(LookupTable_210135_PRP_PRD) SELECT uniques(app_name) WHERE workload_name = 'PRP_Master_Workload' SINCE 7 DAYS AGO") {
            embeddedChartUrl
            nrql
            otherResult
            rawResponse
            staticChartUrl
            totalResult
          }
        }
      }
    }`);


    /**
     * * End user performance
     * @appName : 210135-Partner Ready Portal (PRP)-Production
     * */

    const fetch_end_userPerformance_Promise = async (appName) => {
        try {
            const response = await fetchNerdGraphQuery(`{
          actor {
            account(id: 2781667) {
              nrql(query: "from Transaction select count(*) where appName IN ('210135-Partner Ready Portal (PRP)-Production', '212948-Next Generation Quoter-PRD', '213051-Next Gen Quote-To-Order Conversion Engine-PRD') SINCE ${timeUpdater} AGO COMPARE WITH ${timeUpdater} AGO") {
                embeddedChartUrl
                nrql
                otherResult
                rawResponse
                staticChartUrl
                totalResult
              }
            }
          }
        }`);
            return response;
        } catch (error) {
            throw new Error(`Error fetching end user performance: ${error.message}`);
        }
    };

    // Query for uri's
    const fetch_URI_name_Promise = fetchNerdGraphQuery(`{
        actor {
          account(id: 2781667) {
            nrql(query: "FROM lookup(LookupTable_210135_PRP_PRD) SELECT count(*) WHERE workload_name = 'PRP_Master_Workload' AND request_uri != 'NA' AND request_uri != 'custom_uri' FACET custom_metric, request_uri SINCE 7 DAYS AGO") {
              embeddedChartUrl
              nrql
              otherResult
              rawResponse
              staticChartUrl
              totalResult
            }
          }
        }
      }`);

    //Response time
    const fetch_response_time_Promise = async (appName) => {

        //* dynamic appName 
        try {
            let response_Time_Promise = await fetchNerdGraphQuery(`{
          actor {
            account(id: 2781667) {
              nrql(query: "FROM Transaction SELECT average(duration) WHERE appName = '${appName}' SINCE ${timeUpdater} AGO COMPARE WITH ${timeUpdater} AGO") {
                embeddedChartUrl
                nrql
                otherResult
                rawResponse
                staticChartUrl
                totalResult
              }
            }
          }
        }`);
            return response_Time_Promise
        } catch (error) {
            throw new Error(`Error fetching end user performance: ${error.message}`);
        }
    };



    /**
      * * Login_cust | Partnerauth_cust | Homepage_cust
      * @dynamicURI : /web/prp/login | /group/prp | /group/prp/home
      * @appName : : 210135-Partner Ready Portal (PRP)-Production
      */

    const fetch_login_custom_func = async (appName, dynamicURI) => {
        try {
            const response = await fetchNerdGraphQuery(`{
          actor {
            account(id: 2781667) {
              nrql(query: "from Transaction select average(duration) where appName IN ('210135-Partner Ready Portal (PRP)-Production') and (request.uri like '%/web/prp' and request.headers.host = 'partner.hpe.com') SINCE ${timeUpdater} AGO COMPARE WITH ${timeUpdater} AGO") {
                embeddedChartUrl
                nrql
                otherResult
                rawResponse
                staticChartUrl
                totalResult
              }
            }
          }
         }`)
            return response
        } catch (error) {
            throw new Error(`Error fetching end user performance: ${error.message}`);
        }
    }

    const fetch_Partner_custom_func = async (appName, dynamicURI) => {

        try {
            const response = await fetchNerdGraphQuery(`{
          actor {
            account(id: 2781667) {
              nrql(query: "from Transaction select average(duration) where appName IN ('212948-Next Generation Quoter-PRD') and request.uri LIKE '%qids/saveNewQuoteToQids%' SINCE ${timeUpdater} AGO COMPARE WITH ${timeUpdater} AGO") {
                embeddedChartUrl
                nrql
                otherResult
                rawResponse
                staticChartUrl
                totalResult
              }
            }
          }
         }`)
            return response
        } catch (error) {
            throw new Error(`Error fetching end user performance: ${error.message}`);
        }
    }

    const fetch_HomePage_custom_func = async (appName, dynamicURI) => {

        try {
            const response = await fetchNerdGraphQuery(`{
          actor {
            account(id: 2781667) {
              nrql(query: "from Transaction select average(duration) where appName IN ('212948-Next Generation Quoter-PRD') and request.uri like '%refreshOptimusWithSH%' SINCE ${timeUpdater} AGO COMPARE WITH ${timeUpdater} AGO") {
                embeddedChartUrl
                nrql
                otherResult
                rawResponse
                staticChartUrl
                totalResult
              }
            }
          }
         }`)
            return response
        } catch (error) {
            throw new Error(`Error fetching end user performance: ${error.message}`);
        }
    }


    let deafultHeadingColor = 'grayBackground'

    if (userData_Custom.headlineStatus === 'OPERATIONAL') {
        deafultHeadingColor = 'lightGreenBackground'
    }
    else if (userData_Custom.headlineStatus === 'DEGRADED') {
        deafultHeadingColor = 'yellowBackground'
    }
    else if (userData_Custom.headlineStatus === 'DISRUPTED') {
        deafultHeadingColor = 'redBackground'
    }



    // Progress bar UI
    const progressBarUI = userData.progressCountStatus.map(key => {
        let variant;
        switch (key) {
            case 'DEGRADED':
                variant = 'warning';
                break;
            case 'DISRUPTED':
                variant = 'danger';
                break;
            case 'OPERATIONAL':
                variant = 'success';
                break;
            case 'UNKNOWN':
                variant = 'secondary';
                break;
            default:
                variant = 'info';
                break;
        }
        return <ProgressBar variant={variant} now={10} key={key} />;
    });



    const getClassNameForPages = (e, pageName) => {
        if (e['comparison'] === 'G') {
            if (userData_Custom[pageName]?.current > e['critical_threshold']) {
                return 'red';
            }
            if (userData_Custom[pageName]?.current >= e['warning_threshold'] && userData_Custom[pageName]?.current < e['critical_threshold']) {
                return 'yellow';
            }
        }

        if (e['comparison'] === 'L') {
            if (userData_Custom[pageName]?.current < e['critical_threshold']) {
                return 'red';
            }
            if (userData_Custom[pageName]?.current?.current < e['warning_threshold'] && userData_Custom[pageName]?.current > e['critical_threshold']) {
                return 'yellow';
            }
        }

        return 'green';
    };

    const pageClassNames = (pageName) => {


        return metricComparison.map(e => {
            if (e['custom_metric'] === pageName || e['standard_metric'] === pageName) {
                return getClassNameForPages(e, pageName);
            }
            return '';
        }).join(' ');
    };

    const showToolTipsValue = (pageName) => {
        for (const pageObject of metricComparison) {
            if (pageObject['standard_metric'] === pageName || pageObject['custom_metric'] === pageName) {
                return (
                    <div>
                        Warning : {pageObject.warning_threshold}
                        <br />
                        Critical : {pageObject.critical_threshold}
                    </div>
                );
            }
        }
    }

    return (
        <Col>
            <Card style={{ maxHeight: "100%", marginBottom: "1.6rem" }} border="dark">
                <Card.Header className={deafultHeadingColor}>
                    {cardName}
                </Card.Header>
                <Card.Body>
                    <Card.Title>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <ProgressBar style={{ width: "60%" }}>{progressBarUI}</ProgressBar>
                            <p style={{ marginLeft: "10px", marginBottom: "0px" }}> Host Status for 3h </p>
                        </div>

                    </Card.Title>
                    <Card.Text>
                        <ListGroup variant="flush">
                            <ListGroup.Item className="listItemCustomPadding">
                                <Row>
                                    <Col sm={7}> Infrastructure Health </Col>
                                    <Col sm={1}>
                                        <FontAwesomeIcon
                                            icon={faCaretUp}
                                            size="2x"
                                            style={{ color: "green" }}
                                        />
                                    </Col>
                                    <Col sm={4} className='text-center'>
                                        {userData_Custom.status_val ? userData_Custom.status_val : 'NA'}
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item className="listItemCustomPadding">
                                <Row>
                                    <Col sm={7}>
                                        <span>Response Time (sec) </span>
                                    </Col>
                                    <Col sm={1}>
                                        <FontAwesomeIcon
                                            icon={userData_Custom['Response time']?.current > userData_Custom['Response time']?.prev ? faCaretUp : faCaretDown}
                                            size="2x"
                                            className={pageClassNames('Response time')}
                                        />
                                    </Col>
                                    <Col sm={4} className='text-center'>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip>{showToolTipsValue('Response time')}</Tooltip>
                                            }>
                                            <span>
                                                {userData_Custom['Response time']?.current ? userData_Custom['Response time']?.current.toFixed(2) : 'NA'}
                                            </span>
                                        </OverlayTrigger>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item className="listItemCustomPadding">
                                <Row>
                                    <Col sm={7}>Synthetic Availability (%) </Col>
                                    <Col sm={1}>
                                        <FontAwesomeIcon
                                            icon={
                                                userData_Custom['Synthetic availability']?.current >=
                                                    userData_Custom['Synthetic availability']?.prev
                                                    ? faCaretUp
                                                    : faCaretDown
                                            }
                                            size="2x"
                                            className={pageClassNames('Synthetic availability')}
                                        />
                                    </Col>
                                    <Col sm={4} className='text-center'>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip>{showToolTipsValue('Synthetic availability')}</Tooltip>
                                            }>
                                            <span>
                                                {userData_Custom['Synthetic availability']?.current ?
                                                    userData_Custom['Synthetic availability']?.current.toFixed(2) : 'NA'}
                                            </span>
                                        </OverlayTrigger>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item className="listItemCustomPadding">
                                <Row>
                                    <Col sm={7}>Throughput  </Col>
                                    <Col sm={1}>
                                        <FontAwesomeIcon
                                            icon={
                                                userData_Custom['End user experience']?.current > userData_Custom['End user experience']?.prev
                                                    ? faCaretUp
                                                    : faCaretDown
                                            }
                                            size="2x"
                                            className={pageClassNames('End user experience')}
                                        />
                                    </Col>
                                    <Col sm={4} className='text-center'>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip>{showToolTipsValue('End user experience')}</Tooltip>
                                            }>
                                            <span>
                                                {userData_Custom['End user experience']?.current ?
                                                    userData_Custom['End user experience']?.current.toFixed(2) : 'NA'}
                                            </span>
                                        </OverlayTrigger>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item className="listItemCustomPadding">
                                <Row>
                                    <Col sm={7}>Login </Col>
                                    <Col sm={1}>
                                        <FontAwesomeIcon
                                            icon={userData_Custom['Login Page']?.current >
                                                userData_Custom['Login Page']?.prev
                                                ? faCaretUp
                                                : faCaretDown}
                                            size="2x"
                                            className={pageClassNames('Login Page')}
                                        />
                                    </Col>
                                    <Col sm={4} className='text-center'>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip>{showToolTipsValue('Login Page')}</Tooltip>
                                            }>
                                            <span>
                                                {userData_Custom['Login Page']?.current ?
                                                    userData_Custom['Login Page']?.current.toFixed(2) : 'NA'}
                                            </span>
                                        </OverlayTrigger>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item className="listItemCustomPadding">
                                <Row>
                                    <Col sm={7}>Save New Quote to Qids</Col>
                                    <Col sm={1}>
                                        <FontAwesomeIcon
                                            icon={
                                                userData_Custom['Partner Authentication']?.current > userData_Custom['Partner Authentication']?.prev
                                                    ? faCaretUp
                                                    : faCaretDown
                                            }
                                            size="2x"
                                            className={pageClassNames('Partner Authentication')}
                                        />
                                    </Col>
                                    <Col sm={4} className='text-center'>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip>{showToolTipsValue('Partner Authentication')}</Tooltip>
                                            }>
                                            <span>
                                                {
                                                    userData_Custom['Partner Authentication']?.current ?
                                                        userData_Custom['Partner Authentication']?.current.toFixed(2) : 'NA'
                                                }
                                            </span>
                                        </OverlayTrigger>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item className="listItemCustomPadding">
                                <Row>
                                    <Col sm={7}>Refresh Price</Col>
                                    <Col sm={1}>
                                        <FontAwesomeIcon
                                            icon={
                                                userData_Custom['Home Page']?.current > userData_Custom['Home Page']?.prev
                                                    ? faCaretUp
                                                    : faCaretDown
                                            }
                                            size="2x"
                                            className={pageClassNames('Home Page')}
                                        />
                                    </Col>
                                    <Col sm={4} className='text-center'>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip>{showToolTipsValue('Home Page')}</Tooltip>
                                            }>
                                            <span>
                                                {userData_Custom['Home Page']?.current ?
                                                    userData_Custom['Home Page']?.current.toFixed(2) : 'NA'}
                                            </span>
                                        </OverlayTrigger>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item className="listItemCustomPadding">
                                <Row>
                                    <Col sm={7}>Active Alerts </Col>
                                    <Col sm={1}>
                                        <FontAwesomeIcon
                                            icon={faCaretUp}
                                            size="2x"
                                            className='green'
                                        />
                                    </Col>
                                    <Col sm={4} className='text-center'>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip>
                                                    {
                                                        <div>
                                                            Warning :{" "}
                                                            {
                                                                userData_Custom?.warningAlertCount?.current &&
                                                                userData_Custom?.warningAlertCount?.current.toFixed(2)
                                                            }
                                                            <br />
                                                            Critical :{" "}
                                                            <a
                                                                target="_blank"
                                                                href="/"
                                                            >
                                                                {
                                                                    userData_Custom?.criticalAlertCount?.current &&
                                                                    userData_Custom?.criticalAlertCount?.current.toFixed(2)
                                                                }
                                                            </a>
                                                        </div>
                                                    }
                                                </Tooltip>
                                            }
                                        >
                                            <span style={{ cursor: "pointer" }}>
                                                {userData_Custom?.criticalAlertCount?.current !== 0 || userData_Custom?.warningAlertCount?.current !== 0 ?
                                                    (
                                                        userData_Custom?.criticalAlertCount?.current +
                                                        userData_Custom?.warningAlertCount?.current
                                                    ).toFixed(2) : "NA"}
                                            </span>
                                        </OverlayTrigger>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card.Text>
                </Card.Body>
            </Card>
        </Col>
    );
};

export default Cardlist;



// Function to make a NerdGraph query
const fetchNerdGraphQuery = async (query) => {
    const response = await NerdGraphQuery.query({ query });
    return response.data;
};


const getOccuranceObject = (data) => {

    var statusOccurances = {};
    const timesliceData = data.actor.account.nrql.rawResponse.facets;

    for (var i = 0; i < timesliceData.length; i++) {
        if (timesliceData[i].name == "UNKNOWN") {
            statusOccurances["unknown"] = [];
            for (var j = 0; j < timesliceData[i].timeSeries.length; j++) {
                statusOccurances["unknown"].push(
                    timesliceData[i].timeSeries[j].inspectedCount
                );
            }
        } else if (timesliceData[i].name == "OPERATIONAL") {
            statusOccurances["operational"] = [];
            for (var j = 0; j < timesliceData[i].timeSeries.length; j++) {
                statusOccurances["operational"].push(
                    timesliceData[i].timeSeries[j].inspectedCount
                );
            }
        } else if (timesliceData[i].name == "DISRUPTED") {
            statusOccurances["disrupted"] = [];
            for (var j = 0; j < timesliceData[i].timeSeries.length; j++) {
                statusOccurances["disrupted"].push(
                    timesliceData[i].timeSeries[j].inspectedCount
                );
            }
        } else if (timesliceData[i].name == "DEGRADED") {
            statusOccurances["degraded"] = [];
            for (var j = 0; j < timesliceData[i].timeSeries.length; j++) {
                statusOccurances["degraded"].push(
                    timesliceData[i].timeSeries[j].inspectedCount
                );
            }
        } else {
            statusOccurances["unknown"].push(0);
            statusOccurances["operational"].push(0);
            statusOccurances["disrupted"].push(0);
            statusOccurances["degraded"].push(0);
        }
    }

    return statusOccurances
}

const formatObject = (obj) => {

    const keys = Object.keys(obj);

    if (!keys.includes("unknown")) {
        obj["unknown"] = [];
        for (var i = 0; i < obj[Object.keys(obj)[0]].length; i++) {
            obj["unknown"].push(0);
        }
    }

    if (!keys.includes("operational")) {
        obj["operational"] = [];
        for (var i = 0; i < obj[Object.keys(obj)[0]].length; i++) {
            obj["operational"].push(0);
        }
    }

    if (!keys.includes("degraded")) {
        obj["degraded"] = [];
        for (var i = 0; i < obj[Object.keys(obj)[0]].length; i++) {
            obj["degraded"].push(0);
        }
    }

    if (!keys.includes("disrupted")) {
        obj["disrupted"] = [];
        for (var i = 0; i < obj[Object.keys(obj)[0]].length; i++) {
            obj["disrupted"].push(0);
        }
    }

    const result = [];
    var output = [];
    const maxLength = Math.max(
        ...Object.values(obj).map((arr) => arr.length)
    );

    for (let i = 0; i < maxLength; i++) {
        const formattedEntry = {};

        for (const key in obj) {
            formattedEntry[key] =
                obj[key][i] !== undefined ? obj[key][i] : null;
        }

        result.push(formattedEntry);
    }

    for (var i = 0; i < result.length; i++) {
        if (result[i].unknown != 0) {
            output.push("UNKNOWN");
        } else if (result[i].degraded != 0) {
            output.push("DEGRADED");
        } else if (result[i].disrupted != 0) {
            output.push("DISRUPTED");
        } else {
            output.push("OPERATIONAL");
        }
    }
    return output;
}

