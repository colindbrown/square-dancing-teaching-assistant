import React from "react";
import List from "./List";
import Alerts from "./Alerts";
import * as db from "../util/dbfunctions";
import PlanFunctionBar from "./PlanFunctionBar";

class PlanSessionView extends React.Component {

    state = {
        callList: [],
        sessionList: [],
        alerts: [],
        sessionNames: [],
        templateNames: [],
        sort: "plus/basic"
    }

    // Lifecycle methods
    componentDidMount() {
        this.loadAllCalls();
        this.loadSessionNames();
        this.loadTemplateNames();
    }

    // Async methods
    async loadAllCalls() {
        db.fetchAllCalls().then((allCalls) => {
            db.displayData(allCalls).then((displayData) => {
                this.setState({ callList: displayData });
            })
        });
    }

    async loadSessionNames() {
        db.fetchSessionNames().then((sessionNames) => { this.setState({ sessionNames }) });
    }

    async loadTemplateNames() {
        db.fetchTemplateNames().then((templateNames) => { this.setState({ templateNames }) });
    }

    async addSession(name) {
        db.fetchSessionCalls(name).then(async (sessionCalls) => {
            const displayData = await db.displayData(sessionCalls);
            displayData.forEach(((call) => {
                this.moveCall(call.name, "sessionList");
            }));
        });
    }

    async addTemplate(name) {
        db.fetchTemplateCalls(name).then(async (templateCalls) => {
            const displayData = await db.displayData(templateCalls);
            displayData.forEach(((call) => {
                this.moveCall(call.name, "sessionList");
            }));
        });
    }

    async saveNewSession(name) {
        if (!name) {
            this.showAlert("alert-warning", "Please name your session");
        } else if (this.state.sessionList.length === 0) {
            this.showAlert("alert-warning", "Please add some calls to your session");
        } else {
            const session = await db.fetchSessionRef(name);
            if (session) {
                this.showAlert("alert-warning", "A session with that name already exists");
            } else {
                const sessionCalls = this.state.sessionList.map((call) => ({ name: call.name, used: false, timestamp: Date.now() }));
                await db.setSession(name, sessionCalls);
                this.showAlert("alert-success", "Session saved");
                this.removeAll();
                this.loadSessionNames();
                return true;
            }
        }
        return false;
    }

    moveCall = (name, destination) => {
        var callList = this.state.callList;
        var sessionList = this.state.sessionList;

        if (destination === "sessionList") {
            const index = callList.findIndex((call) => call.name === name);
            if (index >= 0) {
                sessionList.push(callList[index]);
                callList.splice(index, 1);
            }
        } else {
            const index = sessionList.findIndex((call) => call.name === name);
            if (index >= 0) {
                callList.push(sessionList[index]);
                sessionList.splice(index, 1);
            }
        }
        this.setState({ callList, sessionList });
    }

    showAlert(type, text) {
        const alerts = [{ type: type, text: text }];
        this.setState({ alerts });
    }

    clearAlerts = () => {
        this.setState({ alerts: [] });
    }

    // Props methods
    addAllUsed = async (e) => {
        e.preventDefault();
        db.fetchByEverUsed(true).then(async (calls) => {
            const displayData = await db.displayData(calls);
            displayData.forEach(((call) => {
                this.moveCall(call.name, "sessionList");
            }));
        })
    }

    removeAll = () => {
        const sessionList = this.state.sessionList.slice(0);
        sessionList.forEach((call) => this.moveCall(call.name, "callList"));
    }

    render() {
        return (
            <div>
                <PlanFunctionBar
                    addAllUsed={(e) => this.addAllUsed(e)}
                    removeAll={(e) => this.removeAll(e)}
                    saveNewSession={(name) => this.saveNewSession(name)}
                    addSession={(name) => this.addSession(name)}
                    sessionNames={this.state.sessionNames}
                    addTemplate={(name) => this.addTemplate(name)}
                    templateNames={this.state.templateNames}
                />
                <Alerts alerts={this.state.alerts} clearAlerts={() => this.clearAlerts()} />
                <div className="row">
                    <List size="col-md-6" id="callList" columns={2} calls={this.state.callList} sort={this.state.sort} onClick={(name) => this.moveCall(name, "sessionList")} />
                    <List size="col-md-6" id="sessionList" columns={2} calls={this.state.sessionList} sort={"userOrder"} onClick={(name) => this.moveCall(name, "callList")} />
                </div>
            </div>
        )
    }

}

export default PlanSessionView;
