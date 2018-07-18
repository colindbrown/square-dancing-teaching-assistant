import React from "react";
import ReviewFunctionBar from "./ReviewFunctionBar";
import * as db from "../util/dbfunctions";
import List from "./List";
import Modal from "./Modal";
import Alerts from "./Alerts";

class ReviewClassView extends React.Component {

    state = {
        alerts: [],
        selectedCalls: [],
        sessionNames: [],
        activeFilter: {},
        modalData: {}
    }

    componentDidMount() {
        this.loadAllCalls();
        this.loadSessionNames();

    }

    loadAllCalls = async () => {
        db.fetchAllCalls().then((allCalls) => {
            allCalls.sort((a, b) => this.compareCalls(a, b));
            this.setState({ selectedCalls: allCalls, activeFilter: {} });
        });
    }

    async loadSessionNames() {
        db.fetchSessionNames().then((sessionNames) => { this.setState({ sessionNames }) });
    }

    async loadSession(name) {
        db.fetchSessionCalls(name).then(async (sessionCalls) => {
            const displayData = await db.displayData(sessionCalls);
            displayData.sort((a, b) => this.compareCalls(a, b));
            this.setState({ selectedCalls: displayData, activeFilter: {type: "session", name: name} });
        });
    }

    async showCall(name) {
        db.fetchCallHistory(name).then(async (call) => {
            const sessionData = await db.fetchAllSessions();
            var body = "";
            if (call.uses.length > 0) {
                body = "Uses:"
                call.uses.forEach((id) => {
                    const session = sessionData.find((sessionIterator) => (sessionIterator.id === id));
                    const date = new Date(session.finishedAt);
                    body = body + `\n${session.name}: ${date.toDateString()}`;
                })
            } else {
                body = "This call has never been used";
            }
            this.setState({modalData: {title: call.name, body: body}})
        })
    }

    showAlert(type, text) {
        const alerts = [{ type: type, text: text }];
        this.setState({ alerts });
    }

    clearAlerts = () => {
        this.setState({ alerts: [] });
    }

    compareCalls(a, b) {
        if (a.name < b.name) {
            return -1;
        } else if (a.name > b.name) {
            return 1;
        } else {
            return 0;
        }
    }

    resetFilters() {
        this.setState({ activeFilter: {}});
        this.loadAllCalls();
    }

    selectFilter = async (type, name) => {
        switch (type) {
        case 'Used':
            db.fetchByEverUsed(true).then(async (calls) => {
                const displayData = await db.displayData(calls);
                displayData.sort((a, b) => this.compareCalls(a, b));
                this.setState({ selectedCalls: displayData, activeFilter: {type: "filter", name: type} });
            })
            break;
        case 'Unused':
            db.fetchByEverUsed(false).then(async (calls) => {
                const displayData = await db.displayData(calls);
                displayData.sort((a, b) => this.compareCalls(a, b));
                this.setState({ selectedCalls: displayData, activeFilter: {type: "filter", name: type} });
            })
            break;
        case "New":
            db.fetchNew().then(async (calls) => {
                const displayData = await db.displayData(calls);
                displayData.sort((a, b) => this.compareCalls(a, b));
                this.setState({ selectedCalls: displayData, activeFilter: {type: "filter", name: type} });
            })
            break;
        case "session":
            this.loadSession(name);
            break;
        case "group":
            db.fetchByGroup(name).then((displayData) => {
                displayData.sort((a, b) => this.compareCalls(a, b));
                this.setState({ selectedCalls: displayData, activeFilter: {type: "group", name: "Group " + name} });
            });
            break;
        default:
            console.log(`Selected filter: ${type + name}`);
        }
    }

    exportSelection() {
        var text = "";
        if (this.state.selectedCalls.length > 0) {
            this.state.selectedCalls.forEach(((call) => {
                text = text + "\n" + call.name;
            }));
        } else {
            text = " Please select some calls";
        }
        this.setState({modalData: {title: "Selected Calls", body: text.slice(1)}});
    }

    render() {
        return (
            <div>
                <Modal data={this.state.modalData}/>
                <ReviewFunctionBar
                    sessionNames={this.state.sessionNames}
                    activeFilter={this.state.activeFilter}
                    selectFilter={(type, name) => this.selectFilter(type, name)}
                    exportSelection={() => {this.exportSelection()}}
                    resetFilters={() => this.resetFilters()}
                />
                <Alerts alerts={this.state.alerts} clearAlerts={() => this.clearAlerts()} />
                <div className="row">
                    <List size="col-md-12" id="reviewList" columns={4} calls={this.state.selectedCalls} onClick={(name) => this.showCall(name)} />
                </div>
            </div>
        )
    }

}

export default ReviewClassView;
