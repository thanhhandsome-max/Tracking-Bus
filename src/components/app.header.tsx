'use client';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Link from 'next/link'
import logo from '../../public/image/logo.png'; // Import hình ảnh từ thư mục image
const AppHeader = () => {
    return (
        <div>
            <div className='header-container'>
                <div className='logo'>
                    <img
                        src={logo.src} // Sử dụng thuộc tính src của đối tượng logo
                        alt="SchoolBus Manager Logo"
                        style={{ width: '45px', height: '45px', marginTop: '10px' }}
                    />
                    <div style={{ marginLeft: '10px' }} >
                        <h3 className="">SchoolBus Manager</h3>
                        <p className="">Hệ thống quản lý đưa đón học sinh</p>
                    </div>
                </div>
                <div className='user-info'>
                    <div className="user-avatar">
                        <span >PH</span>
                    </div>
                    <div className="user-name">
                        <span>Nguyen Van A </span>
                    </div>
                </div>
            </div>


            <Navbar expand="lg" className="header" style={{ backgroundColor: '#5679EF' }}>
                <Container>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Link href="/" className='nav-link1'>Trang chủ</Link>
                            <Link href="map" className='nav-link1'>Tuyến xe</Link>
                            <Link href="/map" className='nav-link1'>Lịch sử</Link>
                            <Link href="tiktok" className='nav-link1'>Tin nhắn</Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </div>
    );
}

export default AppHeader;