import React, { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import TimeDropdown from '../TimeDropdown/TimeDropdown';
import Searchbar from '../SearchBar/Searchbar';
import Cardlist from './Card/Cardlist';

const ParentCard = () => {
    const [timeUpdater, setTimeUpdater] = useState('5 MINUTES')


    const timeCollector = (time) => {
        setTimeUpdater(time)
    }

    return (
        <div style={{ maxWidth: "100%" }}>
            <div style={{ maxWidth: "95rem", margin: "auto" }}>
                <div>
                    <Row >
                        <Col >
                            <Searchbar setSearchTerm={''} />
                        </Col>
                        <Col md={{ offset: 5 }} >
                            <TimeDropdown timeCollector={timeCollector} />
                        </Col>
                    </Row>
                </div>
                <div>
                    <Row xs={1} sm={2} md={2} lg={3} xl={3} >
                        <Cardlist cardName={'Hardware Led Quote User Journey'} timeUpdater={timeUpdater} guid={'Mjc4MTY2N3xOUjF8V09SS0xPQUR8MjAzNzEy'} />

                    </Row>
                </div>
            </div>
        </div>
    );
};

export default ParentCard;