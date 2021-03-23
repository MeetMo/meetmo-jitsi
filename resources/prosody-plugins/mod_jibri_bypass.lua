local MUC_NS = "http://jabber.org/protocol/muc";
local jid = require "util.jid";
local pre_jibri_user = os.getenv("JIBRI_RECORDER_USER")
local pre_jibri_domain = os.getenv("XMPP_RECORDER_DOMAIN")

module:hook("muc-occupant-pre-join", function (event)
    local room, stanza = event.room, event.stanza;

    local user, domain, res = jid.split(event.stanza.attr.from);
    log("info", "--------------> user %s domain %s res %s pass %s", tostring(user),tostring(domain),tostring(res),tostring(room:get_password())); 
    
    if ( user == pre_jibri_user and domain == pre_jibri_domain ) then
      local join = stanza:get_child("x", MUC_NS);
      join:tag("password", { xmlns = MUC_NS }):text(room:get_password()); 
    end;
end);
