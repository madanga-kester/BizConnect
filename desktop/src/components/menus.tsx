import { Icon } from "./icons";
import { Avatar } from "./ui";
import { activities } from "../data";

export function CreateMenu({ onClose, onBusiness, onOpportunity, onProduct, onPost }: { onClose: () => void; onBusiness: () => void; onOpportunity: () => void; onProduct: () => void; onPost: () => void }) {
  return (
    <div className="popover create-menu">
      <b>Create something new</b>
      <button onClick={onPost}><Icon name="message"/><span><strong>Post update</strong><small>Share with your community</small></span></button>
      <button onClick={onBusiness}><Icon name="briefcase"/><span><strong>Business</strong><small>Introduce your business</small></span></button>
      <button onClick={onOpportunity}><Icon name="spark"/><span><strong>Opportunity</strong><small>Find a partner or supplier</small></span></button>
      <button onClick={onProduct}><Icon name="box"/><span><strong>Product or service</strong><small>List an offer</small></span></button>
      <button className="popover-dismiss" onClick={onClose}>Cancel</button>
    </div>
  );
}

export function AccountMenu({ onSettings, onSwitch, onLogout }: { onSettings: () => void; onSwitch: () => void; onLogout: () => void }) {
  return (
    <div className="popover account-menu">
      <div className="account-heading">
        <Avatar initials="KM" size="sm"/>
        <span><b>Kester Madanga</b><small>Business owner</small></span>
      </div>
      <button onClick={onSettings}><Icon name="gear"/> Settings</button>
      <button onClick={onSwitch}><Icon name="briefcase"/> Switch business</button>
      <button onClick={onLogout}><Icon name="close"/> Log out</button>
    </div>
  );
}

export function NotificationsPopover({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="popover notifications-popover">
      <div className="popover-title"><b>Notifications</b><button onClick={onOpen}>View all</button></div>
      {activities.slice(0, 3).map(a => (
        <div className="popover-item" key={a.title}>
          <span className="activity-dot" style={{ background: a.color }}/>
          <span><b>{a.title}</b><small>{a.time}</small></span>
        </div>
      ))}
    </div>
  );
}
