//@ts-check
import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Text,
  FlatList,
} from 'react-native';
// @ts-ignore
import css from 'css-to-rn.macro';
// @ts-ignore
import xs from 'xstream';

import * as Qiscus from '../qiscus';
import toast from '../utils/toast';
import Toolbar from '../components/Toolbar';
import ContactItem from '../components/ContactItem';
import ContactChooser from '../components/ContactChooser';

export default class RoomInfo extends React.Component {
  state = {
    page: 'info',
    /** @type import("qiscus-sdk-javascript/typings/model").IQChatRoom? */
    room: null,
    name: null,
    isEditingName: false,
  };

  async componentDidMount() {
    // const roomId = this.props.navigation.getParam("roomId", null);
    /** @type string */
    const roomId = this.props.navigation.getParam('roomId', '2841019');
    if (roomId == null) return;

    const room = await this._loadRoomInfo(Number(roomId));
    this.setState({
      room,
      name: room.name,
    });
  }

  render() {
    if (this.state.page === 'info') return this._render();
    else {
      return (
        <ContactChooser
          onBack={() =>
            this.setState({
              page: 'info',
            })
          }
          onSubmit={this._onSubmit}
        />
      );
    }
  }
  _render() {
    const {room, isEditingName} = this.state;
    const isSingle = room?.type === 'single';

    return (
      <View style={styles.container}>
        <Toolbar
          title="Room Info"
          renderLeftButton={() => (
            <TouchableOpacity onPress={this._onBack}>
              <Image
                source={require(// @ts-ignore
                'assets/ic_back.png')}
              />
            </TouchableOpacity>
          )}
        />

        <View style={styles.avatarContainer}>
          <Image style={styles.avatar} source={{uri: room?.avatarUrl}} />
          {!isSingle && (
            <RoomMeta
              name={this.state.name}
              isEditing={isEditingName}
              onChangeName={this._onChangeName}
              onEditName={this._onEditName}
              onSubmit={this._onSubmitName}
              onEditAvatar={this._onEditAvatar}
            />
          )}
        </View>

        <View style={styles.infoContainer}>
          {room == null && <Text>Loading data ...</Text>}
          {isSingle && <SingleInfo user={this.participant} />}
          {!isSingle && (
            <GroupInfo
              room={this.state.room}
              contacts={this.participants}
              onAddUser={this._onAddUser}
              onRemove={this._onRemove}
            />
          )}
        </View>
      </View>
    );
  }

  get participant() {
    return this.participants.slice().pop();
  }
  get participants() {
    if (this.state.room?.participants == null) return [];
    return (
      this.state.room?.participants?.filter(
        (it) => it.id !== Qiscus.currentUser().id,
      ) ?? []
    );
  }

  /**
   * @param {IQUser} contact
   */
  _onRemove = (contact) => {
    console.log('on:remove', contact);
    Qiscus.q
      .removeParticipants(this.state.room.id, [contact.id])
      .then(() => {
        this.setState((state) => ({
          room: {
            ...state.room,
            participants: state.room.participants.filter(
              (it) => it.id !== contact.id,
            ),
          },
        }));
        toast('Success removing participant');
      })
      .catch((error) => {
        console.log('failed removing participant', error);
      });
  };
  _onAddUser = () => {
    console.log('on_add');
    this.setState({page: 'choose'});
  };

  /**
   * @param {IQUser[]} contacts
   */
  _onSubmit = (contacts) => {
    const userIds = contacts.map((it) => it.id);

    Qiscus.q
      .addParticipants(this.state.room.id, userIds)
      .then((users) => {
        this.setState((state) => ({
          page: 'info',
          room: {
            ...state.room,
            participants: [...state.room.participants, ...users],
          },
        }));
      })
      .catch((error) => {
        console.log('failed adding participants', error);
      });
  };
  _onChangeName = (name) => this.setState({name});
  _onSubmitName = () => {
    if (this.state.name == null) return;
    if (this.state.name.length === 0) return;
    Qiscus.q.updateChatRoom(this.state.room.id, this.state.name).then(() => {
      this.setState({isEditingName: false});
    });
  };
  _onEditName = () => {
    this.setState((state) => ({
      isEditingName: !state.isEditingName,
    }));
  };
  _onEditAvatar = () => {
    console.log('on:change-avatar');
  };
  _onBack = () => {
    this.props.navigation.goBack();
  };

  /** @param {number} roomId */
  _loadRoomInfo = (roomId) => {
    return Qiscus.q
      .getChatRooms([roomId], 1, false, true)
      .then((rooms) => rooms.pop());
  };
}

function RoomMeta(props) {
  const inputStyle = [styles.changeNameInput];
  if (props.isEditing) inputStyle.push(styles.changeNameInputEditing);

  return (
    <View style={styles.changeContainer}>
      <TextInput
        style={inputStyle}
        editable={props.isEditing}
        onChangeText={props.onChangeName}
        onSubmitEditing={props.onSubmit}
        value={props.name}
      />
      <TouchableOpacity style={styles.changeNameBtn} onPress={props.onEditName}>
        <Image
          style={styles.icon}
          source={require(// @ts-ignore
          'assets/ic_edit.png')}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.changeNameBtn}
        onPress={props.onEditAvatar}>
        <Image
          style={styles.icon}
          // @ts-ignore
          source={require('assets/ic_image_attachment.png')}
        />
      </TouchableOpacity>
    </View>
  );
}

/**
 * @param {object} props
 * @param {import('qiscus-sdk-javascript/typings/model').IQUser?} props.user
 */
function SingleInfo(props) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerText}>Information</Text>
      </View>
      <View style={styles.fieldGroup}>
        <View style={styles.fieldIcon}>
          <Image
            style={[styles.icon]}
            // @ts-ignore
            source={require('assets/ic_contact.png')}
          />
        </View>
        <Text style={styles.fieldText}>{props.user?.name}</Text>
      </View>
      <View style={styles.fieldGroup}>
        <View style={styles.fieldIcon}>
          <Image
            style={[styles.icon]}
            source={require(// @ts-ignore
            'assets/ic_id.png')}
          />
        </View>
        <Text style={styles.fieldText}>{props.user?.id}</Text>
      </View>
    </>
  );
}

/**
 * @typedef {import('qiscus-sdk-javascript/typings/model').IQUser} IQUser
 * @typedef {import('qiscus-sdk-javascript/typings/model').IQChatRoom} IQChatRoom
 * @param {object} props
 * @param {() => void} props.onAddUser
 * @param {(user: IQUser) => void} props.onRemove
 * @param {IQUser[]} props.contacts
 * @param {IQChatRoom} props.room
 */
function GroupInfo(props) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerText}>Participants</Text>
      </View>
      <View style={styles.addUserContainer}>
        <TouchableOpacity style={styles.addUserBtn} onPress={props.onAddUser}>
          <Image
            style={styles.icon}
            source={require(// @ts-ignore
            'assets/ic_id.png')}
          />
          <Text style={styles.addUserText}>Add Participants</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        style={styles.contactList}
        initialNumToRender={10}
        keyExtractor={(item) => `${item.id}`}
        data={props.contacts}
        disableVirtualization={false}
        renderItem={(data) => (
          <ContactItem
            contact={data.item}
            renderButton={() => (
              <TouchableOpacity
                style={styles.removeParticipantBtn}
                onPress={() => props.onRemove(data.item)}>
                <Image
                  style={styles.icon}
                  // @ts-ignore
                  source={require('assets/delete.png')}
                />
              </TouchableOpacity>
            )}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create(css`
  .container {
    display: flex;
    height: 100%;
  }
  .avatarContainer {
    flex: 0;
    height: 200px;
    flex-basis: 200px;
    background-color: lightblue;
    overflow: hidden;
  }
  .avatar {
    height: 100%;
    width: 100%;
    resize-mode: cover;
  }
  .changeContainer {
    position: absolute;
    bottom: 0;
    height: 45px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.2);
    padding: 5px;
  }
  .changeNameInput {
    flex: 1;
    flex-basis: 100px;
    width: 100px;
    font-size: 16px;
    color: #fff;
    padding: 0 0 0 10px;
  }
  .changeNameInputEditing {
    background-color: rgba(255, 255, 255, 0.4);
    color: #333;
  }
  .changeNameBtn {
    flex: 0 0 35px;
    height: 35px;
    width: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .icon {
    resize-mode: contain;
  }

  .infoContainer {
    flex: 1 auto;
    display: flex;
    background-color: #fafafa;
    overflow: hidden;
  }
  .header {
    height: 35px;
    padding: 10px;
    background-color: #fafafa;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-end;
  }
  .headerText {
    background: #fafafa;
    font-weight: 600;
    font-size: 10px;
    text-transform: uppercase;
    color: #666;
    letter-spacing: 0.5px;
  }

  .fieldGroup {
    flex: 0 0 46px;
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: white;
  }
  .fieldIcon {
    flex: 0 0 25px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 16px;
  }
  .fieldText {
    background: white;
    padding: 10px;
    flex: 1 auto;
    font-size: 14px;
    color: #2c2c36;
  }
  .fieldButton {
    width: 46px;
    height: 46px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  .addUserContainer {
    flex: 0 45px;
    height: 45px;
  }
  .addUserBtn {
    display: flex;
    flex-direction: row;
    height: 45px;
    flex-basis: 45px;
    align-items: center;
    padding: 10px;
    border-bottom-width: 1px;
    border-bottom-color: #ececec;
    background-color: white;
  }
  .addUserText {
    padding-left: 10px;
  }

  .removeParticipantBtn {
    height: 30px;
    width: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`);
