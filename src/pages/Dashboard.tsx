import '../styles/Dashboard.css';

import * as React from "react";

import Chat from './Chat';
import DroneSim from './DroneSim';
import FarmManager from './FarmManager';
import Reports from './Reports';
import Sidebar from '../components/Sidebar';
import { dashboardStore } from '../stores/DashboardStore';
import { jwtDecode } from 'jwt-decode';
import { observable } from 'mobx';
import { observer } from "mobx-react";

interface DashboardProps {
    token: string;
}

@observer
class Dashboard extends React.Component<DashboardProps> {
    @observable public token: string = this.props.token ?? '';
    @observable public user: { name: string; phone: string; } = { name: '', phone: '' };

    public componentDidMount() {
        this.user = this.token ? jwtDecode(this.token) as { name: string; phone: string } : { name: '', phone: '' };
    }

    render() {
        return (
            <div className="dashboard">
                <Sidebar
                    user={this.user}
                    setFarm={() => dashboardStore.setStep("FarmManager")}
                    setReport={() => dashboardStore.setStep("Reports")}
                    setChat={() => dashboardStore.setStep("Chat")}
                    setDroneSim={() => dashboardStore.setStep("DroneSim")}
                />
                <div className="dashboard">
                    <main className="main-content">
                        {dashboardStore.step === "FarmManager" && (<FarmManager token={this.props.token} />)}
                        {dashboardStore.step === "Reports" && (<Reports token={this.props.token} />)}
                        {dashboardStore.step === "Chat" && (<Chat token={this.props.token} />)}
                        {dashboardStore.step === "DroneSim" && (<DroneSim token={this.props.token} />)}
                    </main>
                </div>
            </div>
        );
    }
}

export default Dashboard;